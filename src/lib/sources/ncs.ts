import { getYoutube, searchYouTube } from "@/lib/innertube";
import { normalizeThumb, type Song } from "@/lib/types";

/**
 * NCS (NoCopyrightSounds) source.
 *
 * NCS publishes everything on its official YouTube channel, so we reach it
 * through the same Innertube engine as the rest of the catalogue – 100%
 * copyright-free electronic music that streams full-length through our proxy.
 */

export const NCS_CHANNEL_ID = "UC_aEa8K-EOJ3D6gOs7HcyNg";
export const NCS_AUTHOR_RE = /nocopyrightsounds|\bncs\b/i;
export const NCS_COPYRIGHT = "FREE — NoCopyrightSounds";

/** Verified, long-lived NCS playlists (channel-curated). */
export const NCS_PLAYLISTS = [
  { id: "PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK", name: "NCS: All Releases", icon: "🎵", description: "Every official NCS release in one long orbit" },
];

const NCS_TOPICS = [
  { key: "dubstep", name: "NCS: Dubstep", icon: "🔊", query: "NCS dubstep release" },
  { key: "house", name: "NCS: House", icon: "🏠", query: "NCS house release" },
  { key: "drum-and-bass", name: "NCS: Drum & Bass", icon: "🥁", query: "NCS drum and bass release" },
  { key: "trap", name: "NCS: Trap", icon: "🪤", query: "NCS trap release" },
  { key: "electronic", name: "NCS: Electronic", icon: "⚡", query: "NCS electronic release" },
  { key: "chill", name: "NCS: Chill", icon: "🧊", query: "NCS chill melodic release" },
  { key: "gaming", name: "NCS: Gaming Mix", icon: "🎮", query: "NCS gaming mix copyright free" },
  { key: "phonk", name: "NCS: Phonk", icon: "💀", query: "NCS phonk release" },
];

export function ncsCollections() {
  return [...NCS_PLAYLISTS, ...NCS_TOPICS.map((t) => ({ id: `topic:${t.key}`, name: t.name, icon: t.icon, description: `Live feed · ${t.query}` }))];
}

/** NCS titles follow "Artist - Title | Genre | NCS - Copyright Free Music". */
export function parseNcsTitle(raw: string): { title: string; artist?: string; genre?: string } {
  const cleaned = raw
    .replace(/\s*\|?\s*NCS\s*-\s*Copyright Free Music\s*$/i, "")
    .replace(/\s*\|?\s*NCS Release\s*$/i, "")
    .replace(/\s*\[?NCS\]?\s*$/i, "")
    .trim();
  const parts = cleaned.split("|").map((p) => p.trim()).filter(Boolean);
  const head = parts[0] || cleaned;
  const genre = parts[1] || undefined;
  const split = /^([^-–|]{2,48})\s+[-–]\s+(.+)$/.exec(head);
  if (split) return { title: split[2].trim(), artist: split[1].trim(), genre };
  return { title: head, genre };
}

function tagNcs(song: Song): Song {
  return { ...song, provider: "ncs", copyright: NCS_COPYRIGHT, genre: song.genre || "NCS / Electronic", artist: song.artist || "NoCopyrightSounds" };
}

/** Search inside the NCS catalogue (channel-filtered Innertube search). */
export async function searchNCS(query: string, limit = 20): Promise<Song[]> {
  const terms = [`${query} NCS Release`, `${query} NCS copyright free`, `NCS ${query}`];
  const out: Song[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const results = await searchYouTube(term, 24);
    for (const r of results) {
      if (seen.has(r.id)) continue;
      if (!NCS_AUTHOR_RE.test(r.artist) && !NCS_AUTHOR_RE.test(r.title)) continue;
      seen.add(r.id);
      const parsed = parseNcsTitle(r.title);
      out.push(
        tagNcs({
          ...r,
          title: parsed.title || r.title,
          artist: parsed.artist || (NCS_AUTHOR_RE.test(r.artist) ? r.artist.replace(/\s*-\s*topic$/i, "") : "NoCopyrightSounds"),
          genre: parsed.genre ? `NCS / ${parsed.genre}` : r.genre,
        })
      );
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function text(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.text === "string") return value.text;
  if (Array.isArray(value.runs)) return value.runs.map((r: any) => r?.text || "").join("");
  return "";
}

function parseDuration(value: any, fallbackText = ""): number {
  if (typeof value?.seconds === "number") return value.seconds;
  if (typeof value === "number") return value;
  const m = /(\d+):(\d{2})(?::(\d{2}))?/.exec(text(value) || fallbackText);
  if (!m) return 0;
  return m[3] ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : Number(m[1]) * 60 + Number(m[2]);
}

/** Defensive mapper – Innertube playlist items expose several shapes. */
export function mapPlaylistItem(item: any): Song | null {
  if (!item) return null;
  const id = item.id || item.content_id || item.video_id || item.videoId;
  if (!id || typeof id !== "string") return null;

  const runsText = Array.isArray(item.parsed_runs) ? item.parsed_runs.map((r: any) => r?.text || "").join(" ") : "";
  const rawTitle = text(item.title) || text(item.metadata?.title) || runsText || "";
  const cleanTitleText = rawTitle.replace(/\s*·\s*\d+:\d{2}(:\d{2})?\s*$/, "").trim();
  const authorRaw = text(item.author?.name ? item.author : item.author) || text(item.metadata?.subtitle) || "";

  const thumbs = item.thumbnails || item.content_image || item.thumbnail || [];
  const thumb = Array.isArray(thumbs) ? thumbs[thumbs.length - 1]?.url || thumbs[0]?.url : thumbs?.url;

  const parsed = parseNcsTitle(cleanTitleText);
  return {
    id: `yt:${id}`,
    title: parsed.title || cleanTitleText || "NCS Release",
    artist: parsed.artist || (authorRaw && !/·/.test(authorRaw) ? authorRaw : "NoCopyrightSounds"),
    duration: parseDuration(item.duration, rawTitle),
    // playlist items rarely expose artwork – YouTube thumbnails always resolve by video id
    thumbnail: normalizeThumb(thumb) || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    source: "youtube",
    provider: "ncs",
    copyright: NCS_COPYRIGHT,
    genre: parsed.genre ? `NCS / ${parsed.genre}` : "NCS / Electronic",
    album: parsed.title || cleanTitleText,
    views: text(item.view_count) || "",
  };
}

const playlistCache = new Map<string, { at: number; songs: Song[] }>();

/** Tracks of an NCS (or any YouTube) playlist, mapped to Calamify songs. */
export async function getNCSPlaylist(playlistId: string, limit = 60): Promise<Song[]> {
  const cached = playlistCache.get(playlistId);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.songs;

  // Topic collections are live search feeds rather than fixed playlists.
  if (playlistId.startsWith("topic:")) {
    const topic = NCS_TOPICS.find((t) => `topic:${t.key}` === playlistId);
    const songs = topic ? (await searchNCS(topic.query.replace(/^NCS\s*/i, ""), limit)).map((s) => ({ ...s, genre: topic.name })) : [];
    playlistCache.set(playlistId, { at: Date.now(), songs });
    return songs;
  }

  try {
    const yt = await getYoutube();
    const playlist = await yt.getPlaylist(playlistId);
    const items = playlist?.items || playlist?.videos || [];
    const songs: Song[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const song = mapPlaylistItem(item);
      if (!song || seen.has(song.id)) continue;
      seen.add(song.id);
      songs.push(song);
      if (songs.length >= limit) break;
    }
    playlistCache.set(playlistId, { at: Date.now(), songs });
    return songs;
  } catch {
    return [];
  }
}

/** Discover more real NCS playlists straight from Innertube search. */
export async function discoverNCSPlaylists(limit = 8): Promise<{ id: string; name: string; count?: number }[]> {
  try {
    const yt = await getYoutube();
    const res = await yt.search("NCS NoCopyrightSounds", { type: "playlist" });
    const out: { id: string; name: string; count?: number }[] = [];
    for (const p of res?.playlists || []) {
      const id = (p as any).id || (p as any).content_id;
      const name = text((p as any).title) || text((p as any).metadata?.title);
      if (!id || !name) continue;
      out.push({ id, name, count: (p as any).video_count?.text ? parseInt(String((p as any).video_count.text), 10) : undefined });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
