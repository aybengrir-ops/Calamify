import { type Song, normalizeThumb, cleanTitle } from "./types";

/**
 * Innertube (youtubei.js) provider.
 *
 * youtubei.js talks to YouTube's own internal API – the exact same API the
 * YouTube mobile app uses – so it cannot be blocked like yt-dlp/Piped/Invidious.
 * The instance is created ONCE and reused for the lifetime of the server.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type YT = any;

const g = globalThis as unknown as { __calamifyYt?: Promise<YT> };

export function getYoutube(): Promise<YT> {
  if (!g.__calamifyYt) {
    g.__calamifyYt = (async () => {
      const mod = await import("youtubei.js");
      const Innertube = mod.Innertube ?? (mod as any).default?.Innertube;
      return await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new mod.UniversalCache(false),
      });
    })();
  }
  return g.__calamifyYt;
}

export interface ResolvedStream {
  url: string;
  size: number;
  mime: string;
  itag: number;
  client: string;
  resolvedAt: number;
}

const streamCache = new Map<string, ResolvedStream>();
const STREAM_TTL = 45 * 60 * 1000;

/** Clients that are known to hand back directly-usable stream URLs. */
const CLIENTS = ["IOS", "ANDROID", "WEB", "MWEB"] as const;

function pickAudioFormat(formats: any[]): any | null {
  const audio = formats.filter((f) => (f.mime_type || "").startsWith("audio/") && f.content_length);
  if (!audio.length) return null;
  // Prefer audio/mp4 (plays in every browser, incl. Safari) then webm/opus.
  const mp4 = audio.filter((f) => (f.mime_type || "").includes("audio/mp4"));
  const pool = mp4.length ? mp4 : audio;
  return pool.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0] ?? null;
}

/**
 * Resolve a downloadable audio URL for a YouTube video, trying clients in order.
 */
export async function resolveAudioStream(videoId: string, force = false): Promise<ResolvedStream | null> {
  const cached = streamCache.get(videoId);
  if (!force && cached && Date.now() - cached.resolvedAt < STREAM_TTL) return cached;

  const yt = await getYoutube();
  for (const client of CLIENTS) {
    try {
      const info = await yt.getInfo(videoId, { client });
      const formats = info?.streaming_data?.adaptive_formats || [];
      const format = pickAudioFormat(formats);
      if (!format) continue;
      let url: string = format.url || "";
      if (!url && format.signature_cipher) {
        try {
          url = await format.decipher(yt.session.player);
        } catch {
          url = "";
        }
      }
      if (!url) continue;
      const resolved: ResolvedStream = {
        url,
        size: format.content_length || 0,
        mime: (format.mime_type || "audio/mp4").split(";")[0].trim(),
        itag: format.itag || 0,
        client,
        resolvedAt: Date.now(),
      };
      streamCache.set(videoId, resolved);
      return resolved;
    } catch {
      /* try the next client */
    }
  }
  return null;
}

function mapVideo(v: any): Song | null {
  const id = v?.id;
  const title = typeof v?.title === "string" ? v.title : v?.title?.text;
  if (!id || !title) return null;
  const duration = v?.duration?.seconds ?? 0;
  if (duration && duration < 20) return null; // skip shorts / stingers
  const thumbs = v?.thumbnails || v?.author?.thumbnails || [];
  const best = thumbs[thumbs.length - 1] || thumbs[0];
  return {
    id: `yt:${id}`,
    title,
    artist: v?.author?.name || v?.author || "Unknown Artist",
    duration,
    thumbnail: normalizeThumb(best?.url) || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    source: "youtube",
    views: v?.view_count?.text || v?.view_count || "",
    channelId: v?.author?.id,
    album: cleanTitle(title),
  };
}

export async function searchYouTube(query: string, limit = 20): Promise<Song[]> {
  try {
    const yt = await getYoutube();
    const res = await yt.search(query, { type: "video" });
    const raw = [...(res?.videos || []), ...((res?.results || []).flatMap((r: any) => r?.videos || []) as any[])];
    const seen = new Set<string>();
    const out: Song[] = [];
    for (const v of raw) {
      const song = mapVideo(v);
      if (!song || seen.has(song.id)) continue;
      seen.add(song.id);
      out.push(song);
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

export async function getVideoMeta(videoId: string): Promise<Song | null> {
  try {
    const yt = await getYoutube();
    const info = await yt.getBasicInfo(videoId);
    const d = info?.video_details || info?.playability_status || {};
    const thumbs = info?.streaming_data?.thumbnails || d?.thumbnails || [];
    return {
      id: `yt:${videoId}`,
      title: d?.title || "Unknown title",
      artist: d?.author || "Unknown Artist",
      duration: Number(d?.length_seconds || 0),
      thumbnail: normalizeThumb(thumbs[thumbs.length - 1]?.url),
      source: "youtube",
      views: String(d?.view_count || ""),
    };
  } catch {
    return null;
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  try {
    const yt = await getYoutube();
    const list = await yt.getSearchSuggestions(query);
    return (list || []).map((s: any) => (typeof s === "string" ? s : s?.query)).filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

/** Endless radio built from real Innertube search results. */
export async function buildRadio(seed: Song): Promise<Song[]> {
  const queries = [
    `${seed.artist} ${seed.title}`,
    `${seed.artist} mix`,
    seed.genre ? `${seed.genre} mix ${seed.artist}` : `${seed.artist} official audio`,
  ];
  const out: Song[] = [];
  const seen = new Set<string>([seed.id]);
  for (const q of queries) {
    for (const s of await searchYouTube(q, 12)) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ ...s, genre: s.genre || seed.genre });
      if (out.length >= 30) return out;
    }
  }
  return out;
}
