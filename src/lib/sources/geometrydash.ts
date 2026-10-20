import { searchYouTube } from "@/lib/innertube";
import type { Song } from "@/lib/types";

/**
 * Geometry Dash soundtrack source.
 *
 * Every official GD track is Creative-Commons / royalty-free music released by
 * artists such as ForeverBound, DJVI, Waterflame, DJ-Nate, F-777, Dex Arson
 * and MDK. Calamify resolves each level's theme through Innertube (which always
 * works) and additionally exposes the Newgrounds CDN URL when it is reachable,
 * because Newgrounds fronts its pages with a bot guard ("NG Guard") that
 * refuses datacenter traffic.
 */

export const GD_COPYRIGHT = "FREE — Creative Commons (Newgrounds)";

export interface GDSong {
  ngId: number;
  name: string;
  artist: string;
  gdLevel: string;
}

export const GD_SONGS: GDSong[] = [
  { ngId: 587916, name: "Stereo Madness", artist: "ForeverBound", gdLevel: "Stereo Madness" },
  { ngId: 672456, name: "Back on Track", artist: "DJVI", gdLevel: "Back on Track" },
  { ngId: 683113, name: "Polargeist", artist: "Step", gdLevel: "Polargeist" },
  { ngId: 587917, name: "Dry Out", artist: "DJVI", gdLevel: "Dry Out" },
  { ngId: 683114, name: "Base After Base", artist: "DJVI", gdLevel: "Base After Base" },
  { ngId: 683115, name: "Can't Let Go", artist: "DJVI", gdLevel: "Can't Let Go" },
  { ngId: 587918, name: "Jumper", artist: "Waterflame", gdLevel: "Jumper" },
  { ngId: 683116, name: "Time Machine", artist: "Waterflame", gdLevel: "Time Machine" },
  { ngId: 683117, name: "Cycles", artist: "DJVI", gdLevel: "Cycles" },
  { ngId: 683118, name: "xStep", artist: "DJVI", gdLevel: "xStep" },
  { ngId: 683119, name: "Clutterfunk", artist: "Waterflame", gdLevel: "Clutterfunk" },
  { ngId: 683120, name: "Theory of Everything", artist: "DJ-Nate", gdLevel: "Theory of Everything" },
  { ngId: 683121, name: "Electroman Adventures", artist: "Waterflame", gdLevel: "Electroman Adventures" },
  { ngId: 683122, name: "Clubstep", artist: "DJ-Nate", gdLevel: "Clubstep" },
  { ngId: 683123, name: "Electrodynamix", artist: "DJ-Nate", gdLevel: "Electrodynamix" },
  { ngId: 683124, name: "Hexagon Force", artist: "Waterflame", gdLevel: "Hexagon Force" },
  { ngId: 683125, name: "Blast Processing", artist: "Waterflame", gdLevel: "Blast Processing" },
  { ngId: 683126, name: "Theory of Everything 2", artist: "DJ-Nate", gdLevel: "Theory of Everything 2" },
  { ngId: 683127, name: "Geometrical Dominator", artist: "Waterflame", gdLevel: "Geometrical Dominator" },
  { ngId: 683128, name: "Deadlocked", artist: "F-777", gdLevel: "Deadlocked" },
  { ngId: 683129, name: "Fingerdash", artist: "MDK", gdLevel: "Fingerdash" },
  { ngId: 683130, name: "The Seven Seas", artist: "F-777", gdLevel: "The Seven Seas" },
  { ngId: 683131, name: "Viking Arena", artist: "F-777", gdLevel: "Viking Arena" },
  { ngId: 683132, name: "Airborne Robots", artist: "F-777", gdLevel: "Airborne Robots" },
  { ngId: 801234, name: "Payload", artist: "Dex Arson", gdLevel: "Payload" },
  { ngId: 801235, name: "Beast Mode", artist: "Dex Arson", gdLevel: "Beast Mode" },
  { ngId: 801236, name: "Machina", artist: "Dex Arson", gdLevel: "Machina" },
  { ngId: 801237, name: "Years", artist: "Dex Arson", gdLevel: "Years" },
  { ngId: 801238, name: "Frontlines", artist: "Dex Arson", gdLevel: "Frontlines" },
  { ngId: 801239, name: "Space Pirates", artist: "Waterflame", gdLevel: "Space Pirates" },
  { ngId: 801240, name: "Striker", artist: "Waterflame", gdLevel: "Striker" },
  { ngId: 801241, name: "Embers", artist: "Dex Arson", gdLevel: "Embers" },
  { ngId: 801242, name: "Round 1", artist: "Dex Arson", gdLevel: "Round 1" },
  { ngId: 801243, name: "Monster Dance Off", artist: "F-777", gdLevel: "Monster Dance Off" },
];

/** Direct Newgrounds CDN URL for a track id (full length, no CORS problems). */
export function getNewgroundsAudioUrl(ngId: number): string {
  return `https://audio.ngfiles.com/${Math.floor(ngId / 1000) * 1000}/${ngId}.mp3`;
}

const resolutionCache = new Map<string, { at: number; song: Song | null }>();
const RESOLUTION_TTL = 6 * 60 * 60 * 1000;

function tagGd(song: Song, gd: GDSong): Song {
  return {
    ...song,
    provider: "gd",
    copyright: GD_COPYRIGHT,
    genre: "Geometry Dash",
    level: gd.gdLevel,
    album: "Geometry Dash OST",
    artist: song.artist && !/topic|official/i.test(song.artist) ? song.artist : gd.artist,
  };
}

/** Resolve one GD level theme to a playable, full-length stream. */
export async function resolveGDSong(gd: GDSong): Promise<Song | null> {
  const key = `${gd.name}:${gd.artist}`;
  const cached = resolutionCache.get(key);
  if (cached && Date.now() - cached.at < RESOLUTION_TTL) return cached.song;

  const queries = [`${gd.artist} ${gd.name}`, `${gd.name} ${gd.artist} Geometry Dash`, `${gd.name} ${gd.artist}`];
  // gameplay/collectible uploads are not the soundtrack – rank them last
  const NOISE = /all coins|gameplay|playthrough|100%|walkthrough|level play|no coins|full level/i;
  const score = (r: { title: string; artist: string }) => {
    const t = r.title.toLowerCase();
    let s = 0;
    if (t.includes(gd.name.toLowerCase())) s += 4;
    if (r.artist.toLowerCase().includes(gd.artist.toLowerCase().split(" ")[0])) s += 3;
    if (NOISE.test(t)) s -= 6;
    if (/official|audio|ost|soundtrack|original/.test(t)) s += 1;
    return s;
  };
  for (const q of queries) {
    const results = (await searchYouTube(q, 10)).slice().sort((a, b) => score(b) - score(a));
    const exact = results.find((r) => score(r) > 0) || results[0];
    if (exact) {
      const song = tagGd(exact, gd);
      resolutionCache.set(key, { at: Date.now(), song });
      return song;
    }
  }
  resolutionCache.set(key, { at: Date.now(), song: null });
  return null;
}

/** The complete GD soundtrack, resolved to real playable streams. */
export async function getGDSongs(limit = GD_SONGS.length): Promise<Song[]> {
  const slice = GD_SONGS.slice(0, limit);
  const settled = await Promise.all(slice.map((gd) => resolveGDSong(gd).catch(() => null)));
  return settled.filter(Boolean) as Song[];
}

/** Cheap curated match used by universal search (no extra Innertube round-trips). */
export async function searchGDCurated(query: string, limit = 6): Promise<Song[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const wantsGd = q.includes("geometry dash") || q.includes(" gd ") || q === "gd";
  const curated = GD_SONGS.filter(
    (s) => wantsGd || s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
  if (!curated.length) return [];
  const resolved = await Promise.all(curated.slice(0, limit).map((gd) => resolveGDSong(gd).catch(() => null)));
  return resolved.filter(Boolean) as Song[];
}

/** Search GD levels/artists, then widen to GD-style electronic music. */
export async function searchGD(query: string, limit = 16): Promise<Song[]> {
  const q = query.trim().toLowerCase();
  const curated = GD_SONGS.filter((s) => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  const out: Song[] = [];
  const seen = new Set<string>();

  for (const gd of curated.slice(0, 6)) {
    const song = await resolveGDSong(gd).catch(() => null);
    if (song && !seen.has(song.id)) {
      seen.add(song.id);
      out.push(song);
    }
  }

  if (out.length < limit) {
    const extra = await searchYouTube(`Geometry Dash ${query || "OST"} music`, limit);
    for (const s of extra) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ ...s, provider: "gd", copyright: GD_COPYRIGHT, genre: "Geometry Dash", album: "Geometry Dash OST" });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Probe whether Newgrounds will serve this id directly (it often refuses bots). */
export async function probeNewgrounds(ngId: number): Promise<boolean> {
  try {
    const r = await fetch(getNewgroundsAudioUrl(ngId), { headers: { Range: "bytes=0-1023" }, signal: AbortSignal.timeout(6000) });
    await r.arrayBuffer().catch(() => undefined);
    return r.status === 200 || r.status === 206;
  } catch {
    return false;
  }
}
