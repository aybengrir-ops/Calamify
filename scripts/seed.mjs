/**
 * Calamify seed script.
 *
 * Creates a demo account with a real, playable library: liked songs, three
 * curated playlists, listening history, followed artists, saved albums,
 * notifications and settings. Track metadata is pulled live from the Audius
 * open API so every seeded song actually streams full-length.
 *
 *   node scripts/seed.mjs
 */
import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new pg.Pool({ connectionString: DATABASE_URL });

const EMAIL = "demo@calamify.space";
const PASSWORD = "cosmic123";

async function fetchTracks(query, limit = 8) {
  try {
    const res = await fetch(`https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=Calamify`);
    const json = await res.json();
    return (json.data || []).slice(0, limit).map((t) => ({
      id: `au:${t.id}`,
      title: t.title,
      artist: t?.user?.name || "Unknown Artist",
      duration: Number(t.duration || 0),
      thumbnail: t?.artwork?.["480x480"] || t?.artwork?.["150x150"] || "",
      genre: t.genre || t.mood || "",
      album: t.title,
      views: t.play_count ? `${t.play_count} plays` : "",
    }));
  } catch (e) {
    console.warn(`search failed for "${query}": ${e.message}`);
    return [];
  }
}

async function main() {
  const client = await pool.connect();
  try {
    // ---- demo user -------------------------------------------------
    const hash = await bcrypt.hash(PASSWORD, 10);
    const existing = await client.query("select id from users where email = $1", [EMAIL]);
    let userId;
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      await client.query("update users set display_name = $2, password_hash = $3, bio = $4, favorite_genres = $5::jsonb where id = $1", [
        userId,
        "Nova Demo",
        hash,
        "Astronaut by day, crate-digger by night. Streaming the whole galaxy one full-length track at a time.",
        JSON.stringify(["Lo-Fi", "Electronic", "Synthwave", "Ambient"]),
      ]);
      await client.query("delete from likes where user_id = $1", [userId]);
      await client.query("delete from history where user_id = $1", [userId]);
      await client.query("delete from playlist_songs where playlist_id in (select id from playlists where user_id = $1)", [userId]);
      await client.query("delete from playlists where user_id = $1", [userId]);
      await client.query("delete from followed_artists where user_id = $1", [userId]);
      await client.query("delete from saved_albums where user_id = $1", [userId]);
      await client.query("delete from notifications where user_id = $1", [userId]);
    } else {
      const created = await client.query(
        `insert into users (email, username, display_name, password_hash, avatar_seed, bio, is_public, favorite_genres)
         values ($1, $2, $3, $4, $5, $6, true, $7::jsonb) returning id`,
        [
          EMAIL,
          "novademo",
          "Nova Demo",
          hash,
          "🧑‍🚀",
          "Astronaut by day, crate-digger by night. Streaming the whole galaxy one full-length track at a time.",
          JSON.stringify(["Lo-Fi", "Electronic", "Synthwave", "Ambient"]),
        ]
      );
      userId = created.rows[0].id;
    }
    await client.query(
      `insert into user_settings (user_id, audio_quality, crossfade, gapless, normalize_volume, theme, density, language)
       values ($1, 'high', 3, true, false, 'space-dark', 'comfortable', 'en')
       on conflict (user_id) do update set audio_quality = excluded.audio_quality, crossfade = excluded.crossfade`,
      [userId]
    );

    // ---- collect real tracks ---------------------------------------
    const pools = await Promise.all([
      fetchTracks("lofi chill beats", 10),
      fetchTracks("synthwave night drive", 8),
      fetchTracks("deep house groove", 8),
      fetchTracks("ambient space drone", 6),
      fetchTracks("hip hop instrumental", 6),
    ]);
    const all = pools.flat().filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
    console.log(`collected ${all.length} real tracks`);
    if (!all.length) throw new Error("No tracks fetched – check network access");

    // ---- song cache -------------------------------------------------
    for (const t of all) {
      await client.query(
        `insert into songs (id, title, artist, duration, thumbnail, genre, album, views)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set title = excluded.title, artist = excluded.artist, thumbnail = excluded.thumbnail`,
        [t.id, t.title, t.artist, t.duration, t.thumbnail, t.genre || null, t.album || null, t.views || null]
      );
    }

    // ---- liked songs ------------------------------------------------
    const liked = all.slice(0, 14);
    for (const [i, t] of liked.entries()) {
      await client.query("insert into likes (user_id, song_id, created_at) values ($1,$2, now() - ($3 || ' hours')::interval)", [userId, t.id, i * 7]);
    }

    // ---- playlists --------------------------------------------------
    const defs = [
      { name: "Space Vibes", description: "Weightless grooves for long drifts between planets.", seed: "nebula", tracks: pools[0].slice(0, 8) },
      { name: "Midnight Nebula", description: "Synths, reverb tails and neon horizons after 2am.", seed: "solar", tracks: pools[1].concat(pools[2]).slice(0, 9) },
      { name: "Deep Focus Orbit", description: "Ambient beds that keep the mission on schedule.", seed: "void", tracks: pools[3].concat(pools[4]).slice(0, 8) },
    ];
    for (const d of defs) {
      const pl = await client.query(
        "insert into playlists (user_id, name, description, cover_seed, is_public) values ($1,$2,$3,$4,true) returning id",
        [userId, d.name, d.description, d.seed]
      );
      const pid = pl.rows[0].id;
      for (const [i, t] of d.tracks.entries()) {
        await client.query("insert into playlist_songs (playlist_id, song_id, position) values ($1,$2,$3) on conflict do nothing", [pid, t.id, i]);
      }
    }

    // ---- history ----------------------------------------------------
    for (const [i, t] of all.slice(0, 22).entries()) {
      await client.query("insert into history (user_id, song_id, duration_listened, played_at) values ($1,$2,$3, now() - ($4 || ' hours')::interval)", [
        userId,
        t.id,
        Math.max(30, Math.floor(t.duration * 0.8)),
        i * 3,
      ]);
    }

    // ---- followed artists / saved albums ----------------------------
    const artists = [...new Set(all.map((t) => t.artist))].slice(0, 6);
    for (const a of artists) {
      const thumb = all.find((t) => t.artist === a)?.thumbnail || "";
      await client.query("insert into followed_artists (user_id, artist_name, thumbnail, listeners) values ($1,$2,$3,$4) on conflict do nothing", [
        userId,
        a,
        thumb,
        `${(Math.random() * 900 + 100).toFixed(0)}K`,
      ]);
    }
    for (const [i, a] of artists.slice(0, 3).entries()) {
      const track = all.find((t) => t.artist === a);
      await client.query(
        "insert into saved_albums (user_id, album_key, name, artist, year, cover_url, query) values ($1,$2,$3,$4,$5,$6,$7) on conflict do nothing",
        [userId, `${a} — ${track?.title || "Collection"}`, track?.title || "Collection", a, String(new Date().getFullYear() - i), track?.thumbnail || "", `${a} ${track?.title || ""}`]
      );
    }

    // ---- notifications ----------------------------------------------
    const notes = [
      ["welcome", "Welcome back to the cosmos 🌌", "Your seeded library is ready: 14 liked songs and 3 playlists.", "/library"],
      ["release", `${artists[0] || "An artist"} has new material`, "Fresh uploads just landed in your followed feed.", "/artists"],
      ["weekly", "Your Discover Weekly is ready", "30 new tracks picked from your listening orbit.", "/trending"],
      ["playlist", 'Playlist "Space Vibes" updated', "8 tracks · refreshed automatically.", "/playlists"],
    ];
    for (const [i, n] of notes.entries()) {
      await client.query("insert into notifications (user_id, type, title, body, link, read, created_at) values ($1,$2,$3,$4,$5,$6, now() - ($7 || ' hours')::interval)", [
        userId,
        n[0],
        n[1],
        n[2],
        n[3],
        i > 1,
        i * 5,
      ]);
    }

    console.log(`\nSeeded demo account:\n  email:    ${EMAIL}\n  password: ${PASSWORD}\n  likes:    ${liked.length}\n  playlists: ${defs.length}\n  history:  22 plays`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
