/**
 * Shared domain types for Calamify.
 *
 * Every playable song carries a namespaced id so the audio proxy knows which
 * upstream provider to talk to:
 *   yt:<youtubeVideoId>   – resolved through youtubei.js (Innertube)
 *   au:<audiusTrackId>    – resolved through the Audius open API
 */
export type AudioSource = "youtube" | "audius" | "newgrounds" | "quran";

/** Where a track came from – used for copyright-free badges. */
export type Provider = "youtube" | "audius" | "ncs" | "gd" | "ng";

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  thumbnail: string;
  source: AudioSource;
  genre?: string;
  album?: string;
  views?: string;
  channelId?: string;
  provider?: Provider;
  /** e.g. "FREE — NoCopyrightSounds" or "FREE — Creative Commons (Newgrounds)" */
  copyright?: string;
  /** Geometry Dash level name */
  level?: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverSeed: string | null;
  isPublic: boolean;
  songCount: number;
  totalDuration: number;
  createdAt: string;
}

export interface ArtistSummary {
  name: string;
  thumbnail: string;
  listeners: string;
  genre?: string;
  source: AudioSource;
  handle?: string;
}

export function parseSongId(id: string): { source: AudioSource; ref: string } {
  if (id.startsWith("au:")) return { source: "audius", ref: id.slice(3) };
  if (id.startsWith("ng:")) return { source: "newgrounds", ref: id.slice(3) };
  if (id.startsWith("qr:")) return { source: "quran", ref: id.slice(3) };
  if (id.startsWith("yt:")) return { source: "youtube", ref: id.slice(3) };
  if (id.startsWith("ncs:")) return { source: "youtube", ref: id.slice(4) };
  if (id.startsWith("gd:")) return { source: "youtube", ref: id.slice(3) };
  return { source: "youtube", ref: id };
}

/** Copyright-free label used by the UI badges. */
export function copyrightLabel(song: Song): string | null {
  if (song.copyright) return song.copyright;
  if (song.provider === "ncs") return "FREE — NoCopyrightSounds";
  if (song.provider === "gd") return "FREE — Creative Commons";
  if (song.genre === "Quran") return "FREE — Al-Quran Cloud";
  return null;
}

/**
 * Collapse re-uploads of the same recording in a result list.
 * Multi-word titles are distinctive enough to merge on their own; a single-word
 * title ("Alone") only merges when the artists are related, so Alan Walker's
 * "Alone" and Marshmello's "Alone" both survive.
 */
export function collapseReuploads<T extends { id: string; title: string; artist: string }>(list: T[]): T[] {
  const IGNORE = new Set(["official", "music", "video", "audio", "lyrics", "lyric", "release", "the", "hd", "hq", "ft", "feat", "remaster", "remastered", "explicit"]);
  const words = (v: string) =>
    v
      .toLowerCase()
      .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2 && !IGNORE.has(w))
      .sort();
  const out: T[] = [];
  const seen: { key: string[]; artist: string; title: string }[] = [];
  for (const song of list) {
    if (!song?.id) continue;
    const key = words(song.title);
    const artistWords = song.artist.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const isDup = seen.some((prev) => {
      const same = prev.key.length === key.length && prev.key.every((w, i) => w === key[i]);
      if (!same && !(prev.key.length >= 3 && key.length >= 3 && prev.key.join(" ") === key.join(" "))) {
        // allow "Spectre" vs "Alan Walker Spectre" style re-uploads
        const joined = key.join(" ");
        const prevJoined = prev.key.join(" ");
        const contained = joined.length > 6 && (prevJoined.includes(joined) || joined.includes(prevJoined));
        if (!contained) return false;
      }
      const relatedArtist =
        artistWords.some((w) => prev.artist.includes(w) || prev.title.includes(w)) ||
        prev.artist.split(/[^a-z0-9]+/).filter((w) => w.length > 2).some((w) => song.title.toLowerCase().includes(w) || song.artist.toLowerCase().includes(w));
      return key.length >= 2 ? true : relatedArtist;
    });
    if (isDup) continue;
    seen.push({ key, artist: song.artist.toLowerCase(), title: song.title.toLowerCase() });
    out.push(song);
  }
  return out;
}

/**
 * Remove repeats: first by song id, then by normalised title+artist so the
 * same recording reached through two sources only appears once.
 */
export function dedupeSongs<T extends { id: string; title: string; artist: string }>(list: T[]): T[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const out: T[] = [];
  for (const song of list) {
    if (!song?.id || seenIds.has(song.id)) continue;
    const key = `${song.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(official|music|video|audio|lyrics|lyric|hd|hq)\b/g, " ")
      .replace(/^the\s+/, "")
      .replace(/\s+/g, " ")
      .trim()}||${song.artist
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .slice(0, 2)
      .join(" ")}`;
    if (seenNames.has(key)) continue;
    seenIds.add(song.id);
    seenNames.add(key);
    out.push(song);
  }
  return out;
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

export function formatCount(value: string | number | undefined): string {
  if (value === undefined || value === null) return "0";
  if (typeof value === "number") {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
  return value;
}

export function greeting(name?: string | null): string {
  const h = new Date().getHours();
  const base = h < 5 ? "Still orbiting" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name}` : base;
}

export function normalizeThumb(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export function cleanTitle(title: string): string {
  return title
    .replace(/\s*\((official|audio|video|music video|visualizer|lyric|lyrics|hd|hq)[^)]*\)/gi, " ")
    .replace(/\s*\[(official|audio|video|music video|visualizer|lyric|lyrics|hd|hq)[^\]]*\]/gi, " ")
    .replace(/\s*(official|audio|video|music video|visualizer|lyrics?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
