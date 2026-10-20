import { type Song } from "./types";

/**
 * Audius open API provider.
 *
 * Audius serves COMPLETE, full-length MP3 streams with real HTTP Range
 * support and requires no API key. It is Calamify's guaranteed full-length
 * audio backbone + automatic fallback whenever an upstream YouTube stream is
 * throttled or unavailable.
 */

const APP = "Calamify";
const g = globalThis as unknown as { __calamifyAudiusHost?: { host: string; at: number } };

async function j(url: string, timeout = 12000): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(`Audius ${r.status}`);
  return r.json();
}

export async function getHost(): Promise<string> {
  const cached = g.__calamifyAudiusHost;
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.host;
  let host = "https://api.audius.co";
  try {
    const data = await j("https://api.audius.co", 8000);
    const hosts: string[] = data?.data || [];
    if (hosts.length) host = hosts[Math.floor(Math.random() * hosts.length)] || host;
  } catch {
    /* keep the discovery endpoint itself */
  }
  host = host.replace(/\/$/, "");
  g.__calamifyAudiusHost = { host, at: Date.now() };
  return host;
}

function artwork(t: any): string {
  const a = t?.artwork || t?.cover_photo || t?.profile_picture || {};
  return a["1000x1000"] || a["480x480"] || a["150x150"] || "";
}

export function mapTrack(t: any): Song | null {
  if (!t?.id || !t?.title) return null;
  return {
    id: `au:${t.id}`,
    title: t.title,
    artist: t?.user?.name || "Unknown Artist",
    duration: Number(t.duration || 0),
    thumbnail: artwork(t),
    source: "audius",
    genre: t.genre || t.mood || "",
    views: t.play_count ? `${t.play_count} plays` : "",
    album: t.title,
  };
}

export async function searchTracks(query: string, limit = 12): Promise<Song[]> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP}`);
    return (data?.data || []).slice(0, limit).map(mapTrack).filter(Boolean) as Song[];
  } catch {
    return [];
  }
}

export async function trendingTracks(opts: { genre?: string; time?: string; limit?: number } = {}): Promise<Song[]> {
  const { genre, time = "week", limit = 24 } = opts;
  try {
    const host = await getHost();
    const qs = new URLSearchParams({ time, limit: String(limit), app_name: APP });
    if (genre) qs.set("genre", genre);
    const data = await j(`${host}/v1/tracks/trending?${qs.toString()}`);
    const out = (data?.data || []).map(mapTrack).filter(Boolean) as Song[];
    if (out.length) return out;
  } catch {
    /* fall through to search-based trending */
  }
  return searchTracks(genre ? `${genre} mix` : "trending hits", limit);
}

export async function getTrack(id: string): Promise<Song | null> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/tracks/${encodeURIComponent(id)}?app_name=${APP}`);
    return mapTrack(data?.data);
  } catch {
    return null;
  }
}

const streamCache = new Map<string, { url: string; at: number }>();

/** Resolves the (redirected) CDN URL for a track. Never exposed to the browser. */
export async function resolveStreamUrl(id: string, force = false): Promise<string | null> {
  const cached = streamCache.get(id);
  if (!force && cached && Date.now() - cached.at < 8 * 60 * 1000) return cached.url;
  const host = await getHost();
  for (const attempt of [0, 1]) {
    try {
      const r = await fetch(`${host}/v1/tracks/${encodeURIComponent(id)}/stream?app_name=${APP}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      });
      const loc = r.headers.get("location");
      if (r.ok || r.status === 302) {
        if (loc) {
          streamCache.set(id, { url: loc, at: Date.now() });
          return loc;
        }
        // Some hosts stream the body directly instead of redirecting.
        return `${host}/v1/tracks/${encodeURIComponent(id)}/stream?app_name=${APP}`;
      }
      if (attempt === 0) {
        g.__calamifyAudiusHost = undefined;
        continue;
      }
    } catch {
      if (attempt === 0) {
        g.__calamifyAudiusHost = undefined;
        continue;
      }
    }
  }
  return null;
}

export async function searchUsers(query: string, limit = 8): Promise<any[]> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/users/search?query=${encodeURIComponent(query)}&app_name=${APP}`);
    return (data?.data || []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getUser(handleOrId: string): Promise<any | null> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/full/users/handle/${encodeURIComponent(handleOrId)}?app_name=${APP}`);
    return data?.data || null;
  } catch {
    return null;
  }
}

export async function getUserTracks(id: string, limit = 20): Promise<Song[]> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/users/${encodeURIComponent(id)}/tracks?app_name=${APP}`);
    return (data?.data || []).slice(0, limit).map(mapTrack).filter(Boolean) as Song[];
  } catch {
    return [];
  }
}

export async function searchPlaylists(query: string, limit = 10): Promise<any[]> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/playlists/search?query=${encodeURIComponent(query)}&app_name=${APP}`);
    return (data?.data || []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getPlaylistTracks(id: string, limit = 40): Promise<Song[]> {
  try {
    const host = await getHost();
    const data = await j(`${host}/v1/playlists/${encodeURIComponent(id)}/tracks?app_name=${APP}`);
    return (data?.data || []).slice(0, limit).map(mapTrack).filter(Boolean) as Song[];
  } catch {
    return [];
  }
}
