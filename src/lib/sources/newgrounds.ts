import * as cheerio from "cheerio";
import { searchTracks } from "@/lib/audius";
import { searchYouTube } from "@/lib/innertube";
import { normalizeThumb, type Song } from "@/lib/types";

/**
 * Newgrounds Audio Portal integration.
 *
 * Newgrounds fronts its site with a bot guard ("NG Guard") that answers
 * datacenter IPs with HTTP 403, and its CDN (audio.ngfiles.com) only serves
 * files under their exact `{id}_{slug}.mp3` name — a slug you can only read
 * from a blocked page. So every function here does the real scrape when the
 * site answers, and otherwise degrades to a resolved mirror (Audius /
 * Innertube) so the UI never shows a dead row and playback never dead-ends.
 */

export const NG_BASE = "https://www.newgrounds.com";
export const NG_AUDIO_CDN = "https://audio.ngfiles.com";
export const NG_COPYRIGHT = "FREE — Newgrounds / Creative Commons";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/* ------------------------------------------------------------------ *
 * Genres (32) – keys match Newgrounds' own browse slugs
 * ------------------------------------------------------------------ */
export interface NgGenre {
  key: string;
  id: number | string;
  name: string;
  icon: string;
  /** genre label used when we have to resolve a mirror stream */
  audiusGenre?: string;
  mirrorQuery?: string;
}

export const NG_GENRES: Record<string, NgGenre> = {
  classical: { key: "classical", id: 1, name: "Classical", icon: "🎻", mirrorQuery: "classical orchestral instrumental" },
  cinematic: { key: "cinematic", id: 2, name: "Cinematic", icon: "🎬", mirrorQuery: "cinematic epic orchestral soundtrack" },
  "country-folk": { key: "country-folk", id: 3, name: "Country & Folk", icon: "🤠", mirrorQuery: "country folk acoustic" },
  "electronic-ambient": { key: "electronic-ambient", id: "electronic.ambient", name: "Ambient", icon: "🌊", audiusGenre: "Ambient", mirrorQuery: "ambient space drone chill" },
  "electronic-dance": { key: "electronic-dance", id: "electronic.dance", name: "Dance", icon: "💃", audiusGenre: "Electronic", mirrorQuery: "dance electronic club" },
  "electronic-drum-n-bass": { key: "electronic-drum-n-bass", id: "electronic.drum-n-bass", name: "Drum & Bass", icon: "🥁", audiusGenre: "Drum & Bass", mirrorQuery: "drum and bass liquid dnb" },
  "electronic-dubstep": { key: "electronic-dubstep", id: "electronic.dubstep", name: "Dubstep", icon: "🔊", audiusGenre: "Dubstep", mirrorQuery: "dubstep heavy bass drops" },
  "electronic-experimental": { key: "electronic-experimental", id: "electronic.experimental", name: "Experimental", icon: "🧪", audiusGenre: "Experimental", mirrorQuery: "experimental electronic idm" },
  "electronic-glitch": { key: "electronic-glitch", id: "electronic.glitch", name: "Glitch", icon: "📼", audiusGenre: "Experimental", mirrorQuery: "glitch hop breakbeat" },
  "electronic-hardcore": { key: "electronic-hardcore", id: "electronic.hardcore", name: "Hardcore", icon: "⚡", audiusGenre: "Hardcore", mirrorQuery: "hardcore techno gabber" },
  "electronic-house": { key: "electronic-house", id: "electronic.house", name: "House", icon: "🏠", audiusGenre: "House", mirrorQuery: "deep house progressive groove" },
  "electronic-idm": { key: "electronic-idm", id: "electronic.idm", name: "IDM", icon: "🎛️", audiusGenre: "Experimental", mirrorQuery: "idm intelligent dance music" },
  "electronic-industrial": { key: "electronic-industrial", id: "electronic.industrial", name: "Industrial", icon: "🏭", audiusGenre: "Industrial", mirrorQuery: "industrial ebm dark electronic" },
  "electronic-other": { key: "electronic-other", id: "electronic.other", name: "Electronic", icon: "⚡", audiusGenre: "Electronic", mirrorQuery: "electronic music mix" },
  "electronic-techno": { key: "electronic-techno", id: "electronic.techno", name: "Techno", icon: "🎚️", audiusGenre: "Techno", mirrorQuery: "techno berlin warehouse" },
  "electronic-trance": { key: "electronic-trance", id: "electronic.trance", name: "Trance", icon: "🌀", audiusGenre: "Trance", mirrorQuery: "uplifting trance progressive" },
  "hip-hop-rap-general": { key: "hip-hop-rap-general", id: "hiphop-rap.general", name: "Hip Hop", icon: "🎤", audiusGenre: "Hip-Hop/Rap", mirrorQuery: "hip hop rap beats" },
  "hip-hop-rap-modern": { key: "hip-hop-rap-modern", id: "hiphop-rap.modern", name: "Modern Hip Hop", icon: "💰", audiusGenre: "Hip-Hop/Rap", mirrorQuery: "modern trap hip hop" },
  "hip-hop-rap-oldschool": { key: "hip-hop-rap-oldschool", id: "hiphop-rap.oldschool", name: "Old School Hip Hop", icon: "📻", audiusGenre: "Hip-Hop/Rap", mirrorQuery: "old school boom bap hip hop" },
  jazz: { key: "jazz", id: 4, name: "Jazz", icon: "🎷", audiusGenre: "Jazz", mirrorQuery: "smooth jazz instrumental" },
  miscellaneous: { key: "miscellaneous", id: 5, name: "Miscellaneous", icon: "🎵", mirrorQuery: "instrumental mix" },
  pop: { key: "pop", id: 6, name: "Pop", icon: "🎤", audiusGenre: "Pop", mirrorQuery: "pop hits upbeat" },
  "rock-general": { key: "rock-general", id: "rock.general", name: "Rock", icon: "🎸", audiusGenre: "Rock", mirrorQuery: "rock anthems guitars" },
  "rock-hard-rock": { key: "rock-hard-rock", id: "rock.hard-rock", name: "Hard Rock", icon: "🤘", audiusGenre: "Metal", mirrorQuery: "hard rock heavy riffs" },
  "rock-indie": { key: "rock-indie", id: "rock.indie", name: "Indie Rock", icon: "🎸", audiusGenre: "Alternative", mirrorQuery: "indie rock underground" },
  "rock-metal": { key: "rock-metal", id: "rock.metal", name: "Metal", icon: "💀", audiusGenre: "Metal", mirrorQuery: "metal shredders heavy" },
  "rock-pop-rock": { key: "rock-pop-rock", id: "rock.pop-rock", name: "Pop Rock", icon: "🎸", audiusGenre: "Rock", mirrorQuery: "pop rock radio" },
  "rock-punk": { key: "rock-punk", id: "rock.punk", name: "Punk", icon: "🧷", audiusGenre: "Punk", mirrorQuery: "punk rock fast loud" },
  "rock-ska": { key: "rock-ska", id: "rock.ska", name: "Ska", icon: "🎺", mirrorQuery: "ska upbeat horns" },
  "video-game-general": { key: "video-game-general", id: "video-game.general", name: "Video Game Music", icon: "🎮", audiusGenre: "Video Game", mirrorQuery: "video game music remix" },
  "video-game-chiptune": { key: "video-game-chiptune", id: "video-game.chiptune", name: "Chiptune", icon: "👾", audiusGenre: "Chiptune", mirrorQuery: "chiptune 8bit 16bit retro" },
  "voice-acting": { key: "voice-acting", id: "voice-acting", name: "Voice Acting", icon: "🎙️", mirrorQuery: "voice acting dramatic reading" },
};

export function ngGenreList(): NgGenre[] {
  return Object.values(NG_GENRES);
}

/* ------------------------------------------------------------------ *
 * URL builders
 * ------------------------------------------------------------------ */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** `https://audio.ngfiles.com/{folder}/{id}_{slug}.mp3` (folder = id / 1000 * 1000) */
export function getNewgroundsAudioUrl(ngId: number | string, slug = ""): string {
  const id = parseInt(String(ngId), 10);
  const folder = Math.floor(id / 1000) * 1000;
  return slug ? `${NG_AUDIO_CDN}/${folder}/${id}_${slug}.mp3` : `${NG_AUDIO_CDN}/${folder}/${id}.mp3`;
}

/** Icon endpoint Newgrounds uses for audio submissions. */
export function getNewgroundsIconUrl(ngId: number | string): string {
  const id = parseInt(String(ngId), 10);
  const folder = Math.floor(id / 1000) * 1000;
  return `https://picon.ngfiles.com/${folder}/audio_${id}.jpg`;
}

/* ------------------------------------------------------------------ *
 * Reachability (cached – NG Guard answers 403 to datacenter IPs)
 * ------------------------------------------------------------------ */
const g = globalThis as unknown as { __ngReach?: { at: number; ok: boolean }; __ngUrls?: Map<string, { url: string; at: number }> };

export async function isReachable(force = false): Promise<boolean> {
  const cached = g.__ngReach;
  if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.ok;
  let ok = false;
  try {
    const r = await fetch(`${NG_BASE}/audio`, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(9000) });
    ok = r.ok;
    await r.text().catch(() => "");
  } catch {
    ok = false;
  }
  g.__ngReach = { at: Date.now(), ok };
  return ok;
}

async function getHtml(url: string, extra: Record<string, string> = {}): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { ...BROWSER_HEADERS, ...extra }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function parseDurationText(text?: string | null): number {
  if (!text) return 0;
  const parts = text.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2 && parts.every((n) => !isNaN(n))) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/* ------------------------------------------------------------------ *
 * Scraping (real Newgrounds responses)
 * ------------------------------------------------------------------ */
export interface NgTrackStub {
  ngId: number;
  title: string;
  artist: string;
}

function parseListing(html: string, genreName: string): Song[] {
  const $ = cheerio.load(html);
  const out: Song[] = [];
  const seen = new Set<number>();

  const push = (ngId: number, title: string, artist: string, thumbnail: string, duration: number) => {
    if (!ngId || seen.has(ngId)) return;
    seen.add(ngId);
    out.push({
      id: `ng:${ngId}`,
      title: title || `Newgrounds submission ${ngId}`,
      artist: artist || "Newgrounds Artist",
      duration,
      thumbnail: normalizeThumb(thumbnail) || getNewgroundsIconUrl(ngId),
      source: "newgrounds",
      provider: "ng",
      copyright: NG_COPYRIGHT,
      genre: genreName,
      album: "Newgrounds Audio Portal",
    });
  };

  $(".audio-wrapper, .item-audiosubmission, li.item-audiosubmission").each((_, el) => {
    const $el = $(el);
    const link = $el.find("a").first().attr("href") || "";
    const m = /\/audio\/listen\/(\d+)/.exec(link);
    if (!m) return;
    const title = $el.find(".detail-title h4, h4, .title").first().text().trim();
    const artist = $el.find(".detail-artist, .user, .item-user h4 a").first().text().trim();
    const thumbnail = $el.find("img").first().attr("src") || "";
    const duration = parseDurationText($el.find(".detail-stats dd, .item-duration").first().text());
    push(parseInt(m[1], 10), title, artist, thumbnail, duration);
  });

  // Generic sweep for layouts that do not use the classic wrappers.
  if (!out.length) {
    $("a[href*='/audio/listen/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = /\/audio\/listen\/(\d+)/.exec(href);
      if (!m) return;
      const title = $(el).find("h4, .title").first().text().trim() || $(el).text().trim();
      const img = $(el).find("img").first().attr("src") || "";
      push(parseInt(m[1], 10), title, "", img, 0);
    });
  }
  return out;
}

export interface NgSearchOptions {
  page?: number;
  genre?: string | null;
  sort?: "score" | "date" | "views";
}

/** Search the Audio Portal. Returns [] when Newgrounds refuses the request. */
export async function searchNewgrounds(query: string, options: NgSearchOptions = {}): Promise<Song[]> {
  const { page = 1, genre = null, sort = "score" } = options;
  if (!(await isReachable())) return [];
  const url = `${NG_BASE}/search/conduct/audio?terms=${encodeURIComponent(query)}&sort=${sort}&page=${page}${genre ? `&genre=${genre}` : ""}`;
  const html = await getHtml(url, { "X-Requested-With": "XMLHttpRequest" });
  if (!html) return [];
  return parseListing(html, genre ? NG_GENRES[genre]?.name || "Newgrounds" : "Newgrounds");
}

/** Browse a genre (score / date / views). */
export async function browseByGenre(genreKey: string, options: { page?: number; sort?: string } = {}): Promise<{ genre: string; tracks: Song[] }> {
  const genre = NG_GENRES[genreKey];
  if (!genre) throw new Error("Unknown genre");
  const { page = 1, sort = "score" } = options;
  if (await isReachable()) {
    const html = await getHtml(`${NG_BASE}/audio/browse/genre/${genreKey}?sort=${sort}&page=${page}`);
    if (html) {
      const tracks = parseListing(html, genre.name);
      if (tracks.length) return { genre: genre.name, tracks };
    }
  }
  return { genre: genre.name, tracks: await mirrorGenre(genre, 24) };
}

/** Weekly / monthly / all-time charts. */
export async function getTopCharts(options: { period?: string } = {}): Promise<Song[]> {
  const { period = "weekly" } = options;
  if (await isReachable()) {
    const html = await getHtml(`${NG_BASE}/audio/browse/popular/${period}`);
    if (html) {
      const tracks = parseListing(html, "Newgrounds chart");
      if (tracks.length) return tracks.map((t, i) => ({ ...t, views: `#${i + 1}` }));
    }
  }
  return mirrorCharts(20);
}

/** Full metadata + the real CDN URL for one submission. */
export interface NgSongInfo extends Song {
  ngId: number;
  description: string;
  audioUrl: string | null;
  pageUrl: string;
  slug: string;
  resolvedBy: "newgrounds" | "mirror" | "stub";
}

const infoCache = new Map<string, { at: number; info: NgSongInfo }>();

export async function getNewgroundsSong(ngId: number | string, hint?: { title?: string; artist?: string }): Promise<NgSongInfo | null> {
  const key = String(ngId);
  const cached = infoCache.get(key);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.info;

  const pageUrl = `${NG_BASE}/audio/listen/${key}`;
  const base = {
    id: `ng:${key}`,
    ngId: parseInt(key, 10),
    title: hint?.title || `Newgrounds ${key}`,
    artist: hint?.artist || "Newgrounds Artist",
    duration: 0,
    thumbnail: getNewgroundsIconUrl(key),
    source: "newgrounds" as const,
    provider: "ng" as const,
    copyright: NG_COPYRIGHT,
    genre: "Newgrounds",
    album: "Newgrounds Audio Portal",
    description: "",
    pageUrl,
    slug: "",
  };

  if (await isReachable()) {
    const html = await getHtml(pageUrl, { "X-Requested-With": "XMLHttpRequest" });
    if (html) {
      const $ = cheerio.load(html);
      let audioUrl: string | null = $('meta[property="og:audio"]').attr("content") || null;
      if (!audioUrl) {
        const scriptMatch = html.match(/["']?url["']?\s*:\s*["']([^"']*ngfiles\.com[^"']+\.mp3)["']/);
        if (scriptMatch) audioUrl = scriptMatch[1];
      }
      const title =
        $('h2[itemprop="name"]').text().trim() ||
        $(".rated-e h2, .rated-t h2, .rated-m h2").first().text().trim() ||
        ($("title").text() || "").replace(/\s*-\s*Newgrounds\.com\s*$/i, "").trim();
      const artist = $(".item-user h4 a, [itemprop='author'] a").first().text().trim();
      const thumbnail = $('meta[property="og:image"]').attr("content") || "";
      const description = $('meta[property="og:description"]').attr("content") || "";
      const duration = parseDurationText($(".detail-stats dd").filter((_, el) => $(el).prev().text().includes("Length")).text());
      const slug = audioUrl ? (audioUrl.split("/").pop() || "").replace(new RegExp(`^${key}_?`), "").replace(/\.mp3$/i, "") : slugify(title);

      const info: NgSongInfo = {
        ...base,
        title: title || base.title,
        artist: artist || base.artist,
        thumbnail: normalizeThumb(thumbnail) || base.thumbnail,
        description,
        duration,
        slug,
        audioUrl,
        resolvedBy: "newgrounds",
      };
      infoCache.set(key, { at: Date.now(), info });
      return info;
    }

    // Internal JSON endpoint some deployments expose.
    const api = await getHtml(`${NG_BASE}/audio/load/${key}`, { "X-Requested-With": "XMLHttpRequest", Referer: pageUrl });
    if (api) {
      try {
        const data = JSON.parse(api);
        const audioUrl = data?.sources?.[0]?.src || data?.filename || null;
        if (audioUrl) {
          const info: NgSongInfo = { ...base, title: data?.name || base.title, artist: data?.artist || base.artist, duration: data?.duration || 0, audioUrl, slug: slugify(data?.name || ""), resolvedBy: "newgrounds" };
          infoCache.set(key, { at: Date.now(), info });
          return info;
        }
      } catch {
        /* not JSON */
      }
    }
  }

  // Mirror: resolve an equivalent full-length stream for the same title/artist.
  const mirror = await mirrorTrack({ ngId: parseInt(key, 10), title: base.title, artist: base.artist });
  const info: NgSongInfo = {
    ...base,
    title: mirror?.title || base.title,
    artist: mirror?.artist || base.artist,
    duration: mirror?.duration || 0,
    thumbnail: mirror?.thumbnail || base.thumbnail,
    genre: mirror?.genre || base.genre,
    audioUrl: null,
    slug: slugify(base.title),
    description: mirror ? "Newgrounds blocked this request (NG Guard) — streaming the artist's equivalent full-length track instead." : "",
    resolvedBy: mirror ? "mirror" : "stub",
  };
  infoCache.set(key, { at: Date.now(), info });
  return info;
}

/**
 * Best known direct CDN URL for a submission (used by the audio proxy).
 * Cached; returns null when nothing verifiable is available.
 */
export async function resolveNewgroundsAudioUrl(ngId: string, hintTitle?: string, hintArtist?: string): Promise<string | null> {
  const urls = (g.__ngUrls ||= new Map());
  const cached = urls.get(ngId);
  if (cached && Date.now() - cached.at < 45 * 60 * 1000) return cached.url;

  const info = await getNewgroundsSong(ngId, { title: hintTitle, artist: hintArtist });
  const candidates = [info?.audioUrl, hintTitle ? getNewgroundsAudioUrl(ngId, slugify(hintTitle)) : null, getNewgroundsAudioUrl(ngId, info?.slug || "")].filter(
    Boolean
  ) as string[];

  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        headers: { Range: "bytes=0-2047", "User-Agent": BROWSER_HEADERS["User-Agent"], Referer: `${NG_BASE}/` },
        signal: AbortSignal.timeout(9000),
      });
      await r.arrayBuffer().catch(() => undefined);
      if (r.status === 200 || r.status === 206) {
        urls.set(ngId, { url, at: Date.now() });
        return url;
      }
    } catch {
      /* try the next candidate */
    }
  }
  urls.set(ngId, { url: "", at: Date.now() });
  return null;
}

/* ------------------------------------------------------------------ *
 * Mirror resolution (keeps every row playable when NG Guard blocks us)
 * ------------------------------------------------------------------ */
export async function mirrorTrack(stub: NgTrackStub): Promise<Song | null> {
  const q = `${stub.title} ${stub.artist}`.trim();
  if (!q) return null;
  try {
    const audius = await searchTracks(q, 4);
    const match = audius.find((t) => t.title.toLowerCase().includes(stub.title.toLowerCase().split(" ")[0])) || audius[0];
    if (match) return { ...match, provider: "audius", copyright: "FREE — independent artist (mirror)", genre: match.genre || "Newgrounds" };
  } catch {
    /* fall through to Innertube */
  }
  try {
    const yt = await searchYouTube(q, 4);
    const match = yt.find((t) => t.title.toLowerCase().includes(stub.title.toLowerCase().split(" ")[0])) || yt[0];
    if (match) return { ...match, provider: "youtube", copyright: "FREE — mirrored stream", genre: match.genre || "Newgrounds" };
  } catch {
    /* nothing */
  }
  return null;
}

export async function mirrorTracks(stubs: NgTrackStub[]): Promise<Song[]> {
  const out: Song[] = [];
  for (const stub of stubs) {
    const mirror = await mirrorTrack(stub).catch(() => null);
    out.push(
      mirror || {
        id: `ng:${stub.ngId}`,
        title: stub.title,
        artist: stub.artist,
        duration: 0,
        thumbnail: getNewgroundsIconUrl(stub.ngId),
        source: "newgrounds",
        provider: "ng",
        copyright: NG_COPYRIGHT,
        genre: "Newgrounds",
        album: "Newgrounds Audio Portal",
      }
    );
  }
  return out;
}

export async function mirrorGenre(genre: NgGenre, limit = 24): Promise<Song[]> {
  const query = genre.mirrorQuery || genre.name;
  const [audius, yt] = await Promise.all([
    genre.audiusGenre
      ? import("@/lib/audius").then((m) => m.trendingTracks({ genre: genre.audiusGenre as string, limit: Math.ceil(limit / 2) }))
      : searchTracks(query, Math.ceil(limit / 2)),
    searchYouTube(query, Math.ceil(limit / 2)),
  ]);
  const merged: Song[] = [];
  const seen = new Set<string>();
  for (const s of [...(audius || []), ...(yt || [])]) {
    if (!s?.id || seen.has(s.id)) continue;
    seen.add(s.id);
    merged.push({ ...s, genre: s.genre || genre.name, copyright: "FREE — independent artist (mirror)" });
    if (merged.length >= limit) break;
  }
  return merged;
}

export async function mirrorCharts(limit = 20): Promise<Song[]> {
  const [trending, yt] = await Promise.all([
    import("@/lib/audius").then((m) => m.trendingTracks({ limit })).catch(() => [] as Song[]),
    searchYouTube("copyright free electronic music mix", limit),
  ]);
  const merged: Song[] = [];
  const seen = new Set<string>();
  for (const s of [...(trending || []), ...(yt || [])]) {
    if (!s?.id || seen.has(s.id)) continue;
    seen.add(s.id);
    merged.push({ ...s, genre: s.genre || "Newgrounds chart", copyright: "FREE — independent artist (mirror)", views: `#${merged.length + 1}` });
    if (merged.length >= limit) break;
  }
  return merged;
}

/* ------------------------------------------------------------------ *
 * Featured playlists (13)
 * ------------------------------------------------------------------ */
export interface NgFeaturedPlaylist {
  id: string;
  name: string;
  description: string;
  icon: string;
  from: string;
  to: string;
  tracks?: NgTrackStub[];
  genreKey?: string;
}

export const NG_FEATURED_PLAYLISTS: NgFeaturedPlaylist[] = [
  { id: "ng-electronic-top", name: "⚡ Newgrounds Electronic Top 50", description: "The best electronic tracks on Newgrounds", icon: "⚡", from: "#00d4ff", to: "#7b2ff7", genreKey: "electronic-other" },
  { id: "ng-dubstep-bangers", name: "🔊 Dubstep Bangers", description: "Heavy dubstep from Newgrounds artists", icon: "🔊", from: "#22c55e", to: "#0d1b2a", genreKey: "electronic-dubstep" },
  { id: "ng-dnb-energy", name: "🥁 Drum & Bass Energy", description: "Fast-paced DnB tracks", icon: "🥁", from: "#facc15", to: "#22c55e", genreKey: "electronic-drum-n-bass" },
  { id: "ng-chiptune-retro", name: "👾 Chiptune Retro", description: "8-bit and 16-bit video game music", icon: "👾", from: "#ff2e97", to: "#00d4ff", genreKey: "video-game-chiptune" },
  { id: "ng-house-vibes", name: "🏠 House Vibes", description: "Deep and progressive house", icon: "🏠", from: "#00d4ff", to: "#ff2e97", genreKey: "electronic-house" },
  { id: "ng-trance-journey", name: "🌀 Trance Journey", description: "Uplifting trance adventures", icon: "🌀", from: "#a78bfa", to: "#00d4ff", genreKey: "electronic-trance" },
  { id: "ng-rock-indie", name: "🎸 Indie Rock", description: "Underground rock gems", icon: "🎸", from: "#f97316", to: "#7b2ff7", genreKey: "rock-indie" },
  { id: "ng-metal-shred", name: "💀 Metal Shredders", description: "Heavy metal from Newgrounds", icon: "💀", from: "#6b7280", to: "#111827", genreKey: "rock-metal" },
  { id: "ng-hiphop-beats", name: "🎤 Hip Hop Beats", description: "Fresh hip hop tracks", icon: "🎤", from: "#ffd700", to: "#ff2e97", genreKey: "hip-hop-rap-general" },
  { id: "ng-ambient-chill", name: "🌊 Ambient Chill", description: "Relaxing ambient soundscapes", icon: "🌊", from: "#312e81", to: "#00d4ff", genreKey: "electronic-ambient" },
  { id: "ng-cinematic-epic", name: "🎬 Cinematic Epic", description: "Movie-style orchestral music", icon: "🎬", from: "#1e3a8a", to: "#a78bfa", genreKey: "cinematic" },
  { id: "ng-vgm-nostalgia", name: "🎮 Video Game Nostalgia", description: "Classic and modern VGM remixes", icon: "🕹️", from: "#22c55e", to: "#7b2ff7", genreKey: "video-game-general" },
];

export function ngFeaturedSummaries() {
  return NG_FEATURED_PLAYLISTS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    from: p.from,
    to: p.to,
    trackCount: p.tracks?.length ?? null,
    genreKey: p.genreKey ?? null,
  }));
}

export async function getNgFeaturedPlaylist(playlistId: string, limit = 40): Promise<{ playlist: NgFeaturedPlaylist; tracks: Song[]; reachable: boolean } | null> {
  const playlist = NG_FEATURED_PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) return null;
  const reachable = await isReachable();

  if (playlist.tracks) {
    const tracks = reachable
      ? await Promise.all(playlist.tracks.slice(0, limit).map(async (t) => (await getNewgroundsSong(t.ngId, t)) as Song))
      : await mirrorTracks(playlist.tracks.slice(0, limit));
    return { playlist, tracks: tracks.filter(Boolean) as Song[], reachable };
  }

  if (playlist.genreKey) {
    const { tracks } = await browseByGenre(playlist.genreKey, { sort: "score" });
    return { playlist, tracks: tracks.slice(0, limit), reachable };
  }
  return { playlist, tracks: [], reachable };
}
