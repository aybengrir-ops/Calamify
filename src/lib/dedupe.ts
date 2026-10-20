import { parseSongId, type Song } from "./types";

/**
 * Canonical de-duplication for the whole Calamify catalogue.
 *
 * Priority (as specified):
 *   1. same source + same sourceId (videoId / trackId / audioUrl) ⇒ duplicate
 *   2. otherwise normalised artist + title + duration (±2 s)       ⇒ duplicate
 *
 * Intentionally different versions (remix / live / instrumental / nightcore /
 * acoustic / sped-up …) are NEVER merged: the version tag is part of the fuzzy
 * key, so "Spectre" and "Spectre (Remix)" both survive.
 *
 * The first occurrence in list order is canonical; everything else is aliased
 * to it so likes, playlists, queues and the recognition corpus all point at one
 * track.
 */

export function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/\(([^)]*)\)|\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .replace(/\b(official|music|video|audio|lyrics|lyric|release|hd|hq|ft|feat|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const VERSION_RE = /remix|live|instrumental|nightcore|acoustic|unplugged|sped up|slowed|reverb|cover|version|edit|demo|alternate|explicit|clean|karaoke|8 ?bit/gi;

/** Sorted set of version markers, so variants stay distinct. */
export function versionTag(title: string): string {
  const found = (title || "").match(VERSION_RE);
  return found ? [...new Set(found.map((f) => f.toLowerCase()))].sort().join("+") : "";
}

/** Priority 1 key: the upstream identity of the recording. */
export function sourceKey(song: Pick<Song, "id" | "source">): string {
  const { source, ref } = parseSongId(song.id);
  return `${song.source || source}:${ref}`;
}

/** Priority 2 key: artist + title + duration bucket (±2 s) + version tag. */
export function fuzzyKey(song: Pick<Song, "title" | "artist" | "duration">): string {
  const artist = normalizeText(song.artist).split(" ").slice(0, 2).join(" ");
  const title = normalizeText(song.title).replace(/^the\s+/, "");
  const bucket = Math.round((song.duration || 0) / 2);
  return `${artist}||${title}||${bucket}||${versionTag(song.title)}`;
}

export interface DedupeResult<T> {
  kept: T[];
  /** removed id → canonical id */
  aliases: Map<string, string>;
  removed: { duplicate: T; canonical: T; reason: "source" | "fuzzy" }[];
}

/** Keep one canonical version of every track. */
export function dedupeCanonical<T extends Pick<Song, "id" | "title" | "artist" | "duration">>(list: T[]): DedupeResult<T> {
  const bySource = new Map<string, T>();
  const byFuzzy = new Map<string, T>();
  const kept: T[] = [];
  const aliases = new Map<string, string>();
  const removed: DedupeResult<T>["removed"] = [];

  for (const song of list) {
    if (!song?.id) continue;
    const sk = sourceKey({ id: song.id, source: (song as { source?: Song["source"] }).source || parseSongId(song.id).source });
    const fk = fuzzyKey({ title: song.title, artist: song.artist, duration: song.duration });

    const sameSource = bySource.get(sk);
    if (sameSource) {
      aliases.set(song.id, sameSource.id);
      removed.push({ duplicate: song, canonical: sameSource, reason: "source" });
      continue;
    }
    const sameFuzzy = byFuzzy.get(fk);
    if (sameFuzzy) {
      aliases.set(song.id, sameFuzzy.id);
      removed.push({ duplicate: song, canonical: sameFuzzy, reason: "fuzzy" });
      continue;
    }
    bySource.set(sk, song);
    byFuzzy.set(fk, song);
    kept.push(song);
  }
  return { kept, aliases, removed };
}

/** Convenience wrapper returning just the unique list. */
export function uniqueTracks<T extends Pick<Song, "id" | "title" | "artist" | "duration">>(list: T[]): T[] {
  return dedupeCanonical(list).kept;
}

/** Map a possibly-superseded id to its canonical one. */
export function canonicalId(id: string, aliases: Map<string, string>): string {
  let current = id;
  for (let i = 0; i < 4 && aliases.has(current); i++) current = aliases.get(current) as string;
  return current;
}

/**
 * Global alias table for curated catalogue entries that were replaced or
 * removed as duplicates – keeps old likes/playlist rows pointing at the
 * canonical track instead of a dead row.
 */
export const CATALOGUE_ALIASES: Record<string, string> = {
  // "The Spectre" lives in the NCS shelf (canonical); the Alan Walker & Marshmello
  // shelf entry was replaced with a different, unique Alan Walker track.
  "aw-thespectre": "ncs-spectre",
  // removed as duplicates of another entry's stream
  "gd-dash": "gd-fingerdash",
  "gd-sonicwaveinfinity": "gd-sonicwaverebirth",
  "ut-slowdance": "ut-spiderdance",
  "ut-lasthope": "ut-lastgoodbye",
  "tlt-noordinaryworld": "tlt-myordinarylife",
};

export function canonicalEntryId(entryId: string): string {
  return CATALOGUE_ALIASES[entryId] || entryId;
}


/**
 * De-duplicate curated catalogue ENTRIES (the cards a shelf renders).
 * Same artist + same title + same version tag ⇒ one canonical entry, keeping
 * the first occurrence so section order and layout stay exactly as approved.
 */
export function dedupeEntries<T extends { id: string; title: string; artist: string }>(entries: T[]): { kept: T[]; removed: { duplicate: T; canonical: T }[] } {
  const seen = new Map<string, T>();
  const kept: T[] = [];
  const removed: { duplicate: T; canonical: T }[] = [];
  for (const entry of entries) {
    const key = `${normalizeText(entry.artist.split(/ feat\.| & /)[0])}||${normalizeText(entry.title).replace(/^the\s+/, "")}||${versionTag(entry.title)}`;
    const prev = seen.get(key);
    if (prev) {
      removed.push({ duplicate: entry, canonical: prev });
      continue;
    }
    seen.set(key, entry);
    kept.push(entry);
  }
  return { kept, removed };
}
