import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/innertube";
import { searchTracks, searchUsers, getUserTracks } from "@/lib/audius";
import { cacheSongs } from "@/lib/data";
import { formatCount, type Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Artist page data: top songs, releases, bio and similar artists. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") || "").trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  const [ytSongs, auSongs, auUsers] = await Promise.all([
    searchYouTube(`${name} official audio`, 24).catch(() => [] as Song[]),
    searchTracks(name, 12).catch(() => [] as Song[]),
    searchUsers(name, 3).catch(() => []),
  ]);

  // Prefer tracks actually authored by this artist, then top search hits.
  const authored = ytSongs.filter((s) => s.artist.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
  const topSongs = [...(authored.length ? authored : ytSongs).slice(0, 10), ...auSongs.slice(0, 6)];
  const deduped: Song[] = [];
  const seen = new Set<string>();
  for (const s of topSongs) {
    const key = `${s.title.toLowerCase()}::${s.artist.toLowerCase()}`;
    if (seen.has(s.id) || seen.has(key)) continue;
    seen.add(s.id);
    seen.add(key);
    deduped.push(s);
    if (deduped.length >= 14) break;
  }

  const monthlyViews = ytSongs.reduce((acc, s) => acc + parseViews(s.views), 0);
  const auUser = auUsers[0];
  const listeners = Math.max(monthlyViews / 12, (auUser?.follower_count || 0) * 8, 12500);

  // "Releases" are grouped into album-like clusters from the same search pool.
  const releases = deduped.slice(0, 8).map((s, i) => ({
    key: `${name}-${i}-${s.id}`,
    name: s.album || s.title,
    artist: name,
    cover: s.thumbnail,
    year: String(new Date().getFullYear() - (i % 5)),
    query: `${name} ${s.title}`,
    tracks: 1 + (i % 4),
  }));

  const similar = [...new Set(ytSongs.map((s) => s.artist).filter((a) => a && !a.toLowerCase().includes(name.toLowerCase())))]
    .slice(0, 6)
    .map((a) => ({ name: a }));

  await cacheSongs(deduped);

  return Response.json({
    artist: {
      name,
      thumbnail: auUser?.profile_picture?.["480x480"] || deduped[0]?.thumbnail || "",
      cover: deduped[0]?.thumbnail || "",
      listeners: formatCount(Math.round(listeners)),
      followers: formatCount(Math.round(listeners * 0.42)),
      handle: auUser?.handle || "",
      audiusId: auUser?.id || "",
      verified: monthlyViews > 5_000_000 || !!auUser?.is_verified,
      bio:
        auUser?.bio ||
        `${name} is a stellar presence in the Calamify index – a catalogue that keeps expanding across galaxies of genre. Press play and drift through the full discography, hand-picked from the deepest reaches of the music universe.`,
      genre: deduped[0]?.genre || "",
    },
    topSongs: deduped,
    releases,
    similar,
    audiusTracks: auUsers[0]?.id ? await getUserTracks(auUsers[0].id, 10).catch(() => []) : [],
  });
}

function parseViews(views?: string): number {
  if (!views) return 0;
  const digits = views.replace(/[^0-9.]/g, "");
  const n = parseFloat(digits);
  if (isNaN(n)) return 0;
  if (/B/i.test(views)) return n * 1e9;
  if (/M/i.test(views)) return n * 1e6;
  if (/K/i.test(views)) return n * 1e3;
  return n;
}
