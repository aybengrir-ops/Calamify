import { open, mkdir, rename, rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { resolveAudioStream, getVideoMeta, searchYouTube } from "./innertube";
import { resolveStreamUrl, searchTracks } from "./audius";
import { parseSongId, type Song } from "./types";

/**
 * Calamify audio engine.
 *
 * The browser ONLY ever talks to /api/audio/{songId} (our own origin) – a
 * YouTube/Audius CDN URL is never handed to the client, which kills every CORS
 * problem. Requests are served with proper Range support so seeking works.
 *
 * Delivery order (never leaves the user staring at a spinner):
 *   1. Innertube (youtubei.js) full-length audio → cached on disk, range-served
 *   2. Audius full-length MP3 matched by title + artist
 *   3. Whatever bytes YouTube did hand over (degraded, but audible)
 *   4. 502 → the player auto-skips to the next track
 */

const CACHE_DIR = process.env.CALAMIFY_CACHE_DIR || "/tmp/calamify-audio";
const CHUNK = 768 * 1024; // upstream allows < 1 MiB per request
const MAX_DL_MS = 25000;

const g = globalThis as unknown as {
  __calamifyDl?: Map<string, Promise<DownloadResult | null>>;
  __calamifyFiles?: Map<string, { path: string; size: number; mime: string }>;
  __calamifyThrottled?: Map<string, { at: number; partial: DownloadResult | null }>;
  __calamifyFallback?: Map<string, { auId: string; title: string; artist: string; kind?: "same" | "alternative" }>;
  __calamifyNgMirror?: Map<string, { kind: "audius" | "youtube"; ref: string; title: string; artist: string }>;
};
const inflight = (g.__calamifyDl ||= new Map());
const fileIndex = (g.__calamifyFiles ||= new Map());

/** Videos whose upstream refused to hand over the full file (throttled IP/URL). */
const throttledVideos = (g.__calamifyThrottled ||= new Map<string, { at: number; partial: DownloadResult | null }>());
/** Resolved Audius stand-ins for throttled YouTube ids – makes seeking instant. */
const fallbackIndex = (g.__calamifyFallback ||= new Map<string, { auId: string; title: string; artist: string; kind?: "same" | "alternative" }>());
/** Resolved mirrors for Newgrounds ids (NG Guard blocks datacenter traffic). */
const ngMirrorIndex = (g.__calamifyNgMirror ||= new Map<string, { kind: "audius" | "youtube"; ref: string; title: string; artist: string }>());
const THROTTLE_TTL = 20 * 60 * 1000;
/** upstream URL → total byte size (for CDNs that omit Content-Length) */
const probeCache = new Map<string, { at: number; size: number }>();

interface DownloadResult {
  path: string;
  size: number;
  mime: string;
  complete: boolean;
}

export interface AudioOptions {
  range?: string | null;
  title?: string;
  artist?: string;
  warm?: boolean;
  /** force a brand-new upstream resolution (used by the player's failover chain) */
  alt?: boolean;
}

function corsHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, X-Calamify-Source, X-Calamify-Title, X-Calamify-Artist",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Timing-Allow-Origin": "*",
    ...extra,
  };
}

/* ------------------------------------------------------------------ *
 * YouTube: sequential chunked download to a local cache file
 * ------------------------------------------------------------------ */
async function ensureYouTubeFile(videoId: string): Promise<DownloadResult | null> {
  const blocked = throttledVideos.get(videoId);
  if (blocked && Date.now() - blocked.at < THROTTLE_TTL) return blocked.partial;

  const memo = fileIndex.get(videoId);
  if (memo) {
    try {
      const s = await stat(memo.path);
      if (s.size === memo.size) return { ...memo, complete: true };
    } catch {
      fileIndex.delete(videoId);
    }
  }
  const pending = inflight.get(videoId);
  if (pending) return pending;

  const task = (async () => {
    await mkdir(CACHE_DIR, { recursive: true });
    const finalPath = join(CACHE_DIR, `${videoId}.m4a`);
    const partPath = `${finalPath}.part`;
    try {
      const stream = await resolveAudioStream(videoId);
      if (!stream) return null;
      let currentUrl = stream.url;
      const total = stream.size;
      const handle = await open(partPath, "w");
      let pos = 0;
      let strikes = 0;
      const started = Date.now();
      while (pos < total && Date.now() - started < MAX_DL_MS) {
        const end = Math.min(total - 1, pos + CHUNK - 1);
        let res: Response;
        try {
          res = await fetch(currentUrl, {
            headers: { Range: `bytes=${pos}-${end}`, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15" },
            signal: AbortSignal.timeout(12000),
          });
        } catch {
          res = { status: 0 } as Response;
        }
        if (res.status === 206 || res.status === 200) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (!buf.byteLength) break;
          await writeAt(handle, buf, pos);
          pos += buf.byteLength;
          strikes = 0;
          if (buf.byteLength < CHUNK && pos < total) break; // upstream closed early
          continue;
        }
        // Throttled / expired URL → refresh once, then give up.
        strikes += 1;
        if (strikes > 2) break;
        const fresh = await resolveAudioStream(videoId, true);
        if (!fresh || fresh.url === currentUrl) break;
        currentUrl = fresh.url;
      }
      await handle.close();

      if (pos >= total && total > 0) {
        await rename(partPath, finalPath);
        const result = { path: finalPath, size: total, mime: stream.mime, complete: true };
        fileIndex.set(videoId, result);
        void pruneCache();
        return result;
      }
      // Partial: keep it, it is still audible and better than silence.
      if (pos > 128 * 1024) {
        const partialPath = join(CACHE_DIR, `${videoId}.partial.m4a`);
        await rename(partPath, partialPath).catch(() => undefined);
        const partial = { path: partialPath, size: pos, mime: stream.mime, complete: false };
        throttledVideos.set(videoId, { at: Date.now(), partial });
        return partial;
      }
      await rm(partPath, { force: true });
      throttledVideos.set(videoId, { at: Date.now(), partial: null });
      return null;
    } catch {
      await rm(partPath, { force: true }).catch(() => undefined);
      return null;
    } finally {
      inflight.delete(videoId);
    }
  })();

  inflight.set(videoId, task);
  return task;
}

async function writeAt(handle: Awaited<ReturnType<typeof open>>, buf: Buffer, pos: number) {
  try {
    await handle.write(buf, 0, buf.byteLength, pos);
  } catch {
    /* ignore sparse-write issues */
  }
}

async function pruneCache() {
  try {
    const files = await readdir(CACHE_DIR);
    const entries: { name: string; mtime: number; size: number }[] = [];
    for (const f of files) {
      if (!f.endsWith(".m4a") && !f.endsWith(".mp3")) continue;
      try {
        const s = await stat(join(CACHE_DIR, f));
        entries.push({ name: f, mtime: s.mtimeMs, size: s.size });
      } catch {
        /* ignore */
      }
    }
    let total = entries.reduce((a, b) => a + b.size, 0);
    if (total < 700 * 1024 * 1024) return;
    entries.sort((a, b) => a.mtime - b.mtime);
    for (const e of entries) {
      await rm(join(CACHE_DIR, e.name), { force: true });
      total -= e.size;
      if (total < 500 * 1024 * 1024) break;
    }
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Local file → ranged HTTP response
 * ------------------------------------------------------------------ */
function parseRange(header: string | null | undefined, size: number) {
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (header && header.startsWith("bytes=")) {
    const spec = header.slice(6).split(",")[0].trim();
    const [rawStart, rawEnd] = spec.split("-");
    if (rawStart === "" && rawEnd) {
      const suffix = parseInt(rawEnd, 10);
      start = Math.max(0, size - suffix);
      end = size - 1;
    } else {
      start = parseInt(rawStart || "0", 10) || 0;
      end = rawEnd ? Math.min(parseInt(rawEnd, 10), size - 1) : size - 1;
    }
    status = 206;
  }
  if (isNaN(start) || start < 0) start = 0;
  if (isNaN(end) || end > size - 1) end = size - 1;
  return { start, end, status };
}

async function serveFile(path: string, size: number, mime: string, range?: string | null, extra: Record<string, string> = {}) {
  const { start, end, status } = parseRange(range, size);
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: corsHeaders({ "Content-Range": `bytes */${size}`, ...extra }) });
  }
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let handle: Awaited<ReturnType<typeof open>> | null = null;
      try {
        handle = await open(path, "r");
        let pos = start;
        while (pos <= end) {
          const len = Math.min(128 * 1024, end - pos + 1);
          const buf = Buffer.alloc(len);
          const { bytesRead } = await handle.read(buf, 0, len, pos);
          if (bytesRead <= 0) break;
          controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, bytesRead));
          pos += bytesRead;
        }
        controller.close();
      } catch {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      } finally {
        await handle?.close().catch(() => undefined);
      }
    },
  });
  return new Response(stream, {
    status,
    headers: corsHeaders({
      "Content-Type": mime,
      "Content-Length": String(end - start + 1),
      ...(status === 206 ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
      ...extra,
    }),
  });
}

/* ------------------------------------------------------------------ *
 * Audius → streamed proxy with native Range pass-through
 * ------------------------------------------------------------------ */
async function proxyAudius(trackId: string, range?: string | null, extra: Record<string, string> = {}) {
  const url = await resolveStreamUrl(trackId);
  if (!url) return null;
  const headers: Record<string, string> = { "User-Agent": "Calamify/1.0", ...extra };
  if (range) headers.Range = range;
  let upstream: Response;
  try {
    upstream = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  } catch {
    return null;
  }
  if (!upstream.ok && upstream.status !== 206) {
    if (upstream.status === 403 || upstream.status === 404) {
      const retryUrl = await resolveStreamUrl(trackId, true);
      if (retryUrl && retryUrl !== url) {
        try {
          upstream = await fetch(retryUrl, { headers, signal: AbortSignal.timeout(20000) });
        } catch {
          return null;
        }
      }
    }
    if (!upstream.ok && upstream.status !== 206) return null;
  }
  const out: Record<string, string> = corsHeaders(extra);
  out["Content-Type"] = upstream.headers.get("content-type") || "audio/mpeg";
  const len = upstream.headers.get("content-length");
  const crange = upstream.headers.get("content-range");
  if (len) out["Content-Length"] = len;
  if (crange) out["Content-Range"] = crange;
  return new Response(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers: out });
}

/* ------------------------------------------------------------------ *
 * Generic upstream proxy (Newgrounds CDN, any direct media URL)
 * ------------------------------------------------------------------ */
async function proxyUpstream(url: string, range?: string | null, requestHeaders: Record<string, string> = {}, responseHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    ...requestHeaders,
  };
  if (range) headers.Range = range;
  try {
    const upstream = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!upstream.ok && upstream.status !== 206) return null;

    // Some CDNs (islamic.network) answer an un-ranged GET with a chunked body
    // and no Content-Length. Without a length the browser cannot compute
    // `duration`, which is exactly why seeking appears dead while paused.
    // Probe the size, then re-request it as one bounded range so we can label
    // the response 200 + Content-Length + Accept-Ranges.
    if (!range && !upstream.headers.get("content-length")) {
      const size = await probeContentLength(url, requestHeaders);
      if (size && size > 0) {
        await upstream.body?.cancel().catch(() => undefined);
        const bounded = await fetch(url, {
          headers: { ...headers, Range: `bytes=0-${size - 1}` },
          signal: AbortSignal.timeout(25000),
        });
        if (bounded.ok || bounded.status === 206) {
          const outLen: Record<string, string> = corsHeaders(responseHeaders);
          outLen["Content-Type"] = bounded.headers.get("content-type") || "audio/mpeg";
          outLen["Content-Length"] = String(size);
          return new Response(bounded.body, { status: 200, headers: outLen });
        }
      }
    }

    const out: Record<string, string> = corsHeaders(responseHeaders);
    out["Content-Type"] = upstream.headers.get("content-type") || "audio/mpeg";
    const len = upstream.headers.get("content-length");
    const crange = upstream.headers.get("content-range");
    if (len) out["Content-Length"] = len;
    if (crange) out["Content-Range"] = crange;
    return new Response(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers: out });
  } catch {
    return null;
  }
}

/** 1-byte ranged probe → total size from `Content-Range: bytes 0-0/TOTAL`. */
async function probeContentLength(url: string, requestHeaders: Record<string, string> = {}): Promise<number | null> {
  const cache = probeCache.get(url);
  if (cache && Date.now() - cache.at < 6 * 60 * 60 * 1000) return cache.size;
  try {
    const r = await fetch(url, {
      headers: { ...requestHeaders, Range: "bytes=0-0" },
      signal: AbortSignal.timeout(9000),
    });
    const cr = r.headers.get("content-range");
    await r.arrayBuffer().catch(() => undefined);
    let size: number | null = null;
    if (cr) {
      const m = /\/(\d+)\s*$/.exec(cr);
      if (m) size = parseInt(m[1], 10);
    }
    if (!size) {
      const cl = r.headers.get("content-length");
      if (cl && r.status === 200) size = parseInt(cl, 10);
    }
    if (size && size > 0) probeCache.set(url, { at: Date.now(), size });
    return size && size > 0 ? size : null;
  } catch {
    return null;
  }
}

/**
 * Newgrounds delivery: real CDN file when reachable → scraped page URL →
 * full-length mirror (Audius, then Innertube). Never a dead end.
 */
async function deliverNewgrounds(ngId: string, range?: string | null, title?: string, artist?: string): Promise<Response> {
  const ng = await import("./sources/newgrounds");

  // 0. Cached mirror decision → instant, keeps seeking snappy.
  const cached = ngMirrorIndex.get(ngId);
  if (cached) {
    const res = await serveMirror(cached, range);
    if (res) return res;
    ngMirrorIndex.delete(ngId);
  }

  // 1. The real Newgrounds CDN file, when the portal answers our edge.
  const direct = await ng.resolveNewgroundsAudioUrl(ngId, title, artist);
  if (direct) {
    const res = await proxyUpstream(direct, range, { Referer: `${ng.NG_BASE}/` }, { "X-Calamify-Source": "newgrounds" });
    if (res) return res;
  }

  // 2. Full-length mirrors, from the most specific query to the loosest.
  const queries = [
    `${title || ""} ${artist || ""}`.trim(),
    (title || "").replace(/\(.*?\)|\[.*?\]/g, " ").trim(),
    title || "",
    artist || "",
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  for (const q of queries) {
    const pool = await searchTracks(q, 5).catch(() => []);
    const match = pool.find((p) => title && p.title.toLowerCase().includes(title.toLowerCase().split(" ")[0])) || pool[0];
    if (match) {
      const entry = { kind: "audius" as const, ref: match.id.slice(3), title: match.title, artist: match.artist };
      const res = await serveMirror(entry, range);
      if (res) {
        ngMirrorIndex.set(ngId, entry);
        return res;
      }
    }
  }

  // 3. Innertube mirror (complete file when the edge allows it, partial otherwise).
  for (const q of queries) {
    const yt = await searchYouTube(q, 5).catch(() => []);
    const match = yt.find((t) => title && t.title.toLowerCase().includes(title.toLowerCase().split(" ")[0])) || yt[0];
    if (!match) continue;
    const entry = { kind: "youtube" as const, ref: match.id.slice(3), title: match.title, artist: match.artist };
    const res = await serveMirror(entry, range);
    if (res) {
      ngMirrorIndex.set(ngId, entry);
      return res;
    }
  }

  return Response.json({ error: "Newgrounds blocked this edge and no mirror was found" }, { status: 502, headers: corsHeaders() });
}

interface MirrorEntry {
  kind: "audius" | "youtube";
  ref: string;
  title: string;
  artist: string;
}

async function serveMirror(entry: MirrorEntry, range?: string | null) {
  if (entry.kind === "audius") {
    return proxyAudius(entry.ref, range, {
      "X-Calamify-Source": "newgrounds-mirror",
      "X-Calamify-Title": encodeURIComponent(entry.title),
      "X-Calamify-Artist": encodeURIComponent(entry.artist),
    });
  }
  const dl = await ensureYouTubeFile(entry.ref);
  if (!dl) return null;
  return serveFile(dl.path, dl.size, dl.mime, range, {
    "X-Calamify-Source": dl.complete ? "newgrounds-mirror" : "newgrounds-mirror-partial",
    "X-Calamify-Title": encodeURIComponent(entry.title),
    "X-Calamify-Artist": encodeURIComponent(entry.artist),
  });
}


/** Strip upload decoration so the real song name survives: "UNDERTALE - Dogsong - by Toby Fox" → "Dogsong". */
export function coreTitle(value: string): string {
  let t = (value || "")
    .replace(/^\s*\d{1,3}\s*[.)-]\s*/, "") // "024. Bonetrousle"
    .replace(/\(([^)]*)\)|\[[^\]]*\]/g, " ") // "(Official Video)", "[NCS Release]"
    .replace(/\b(official|music|video|audio|lyrics?|visualizer|hd|hq|full|version|release|remaster(ed)?|explicit|topic|ncs|copyright free|no copyright|free|remix|cover|live|mashup|edit|trailer|slowed|sped|up|nightcore|translate(d)?|ukr|instrumental)\b/gi, " ")
    .replace(/\s+[-–—|]\s+/g, " ¦ ")
    .replace(/\s+by\s+[\w\s.&'’-]+$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

/** Drop artist/label segments and keep the actual title part. */
function titleWithoutArtist(title: string, artist: string): string {
  const cleaned = coreTitle(title);
  const segments = cleaned.split("¦").map((x) => x.trim()).filter(Boolean);
  if (segments.length <= 1) return cleaned;
  const artistWords = (artist || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const kept = segments.filter((seg) => {
    const low = seg.toLowerCase();
    return !artistWords.some((w) => low.includes(w)) && !/^(by|ft|feat|vs|with)\b/i.test(low);
  });
  const pool = kept.length ? kept : segments;
  // the song title is normally the last remaining segment ("Alan Walker ¦ Fade")
  return pool[pool.length - 1].trim();
}

/**
 * Find a full-length Audius stand-in for a track. Tries progressively looser
 * queries and scores candidates by title-token overlap + artist, so noisy
 * YouTube titles still land on the right recording.
 */
async function findAudiusMatch(title: string, artist: string): Promise<{ song: Song; kind: "same" | "alternative" } | null> {
  const core = titleWithoutArtist(title, artist);
  const artistCore = (artist || "").replace(/\s*-\s*Topic$/i, "").trim();
  const queries = [`${core} ${artistCore}`.trim(), core, (title || "").trim(), artistCore]
    .map((q) => q.trim())
    .filter((q, i, arr) => q.length > 2 && arr.indexOf(q) === i)
    .slice(0, 4);
  const want = core.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const firstArtistWord = artistCore.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2)[0] || "";

  const VARIANT = /remix|\bcover\b|live|trailer|sight-?read|sheet music|tutorial|slowed|sped up|nightcore|karaoke|instrumental version|8 ?bit|sound effect|stock/i;
  const wantsVariant = VARIANT.test(title || "");

  for (const q of queries) {
    const pool = await searchTracks(q, 8).catch(() => [] as Song[]);
    if (!pool.length) continue;
    const scored = pool
      .map((song) => {
        const t = (song.title || "").toLowerCase();
        const hits = want.filter((w) => t.includes(w)).length;
        const ratio = want.length ? hits / want.length : 0;
        const artistHit = firstArtistWord ? (song.artist || "").toLowerCase().includes(firstArtistWord) || t.includes(firstArtistWord) : false;
        // a different recording (remix/cover/sight-read) is NOT a substitute
        const wrongVariant = !wantsVariant && VARIANT.test(song.title || "");
        // strict: it must really be the same song, otherwise we keep the
        // throttled-but-correct fragment and let the player swap it openly
        const strict =
          !wrongVariant &&
          (song.duration || 0) >= 45 &&
          ((ratio >= 0.66 && artistHit) || (ratio === 1 && want.length >= 2) || (ratio >= 1 && artistHit));
        return { song, strict, score: ratio * 3 + (artistHit ? 1.5 : 0) + (wrongVariant ? -3 : 0) };
      })
      .sort((a, b) => Number(b.strict) - Number(a.strict) || b.score - a.score);
    if (scored[0]?.strict) return { song: scored[0].song, kind: "same" };
  }

  // Second pass: the exact recording is not on the free backbone, but a
  // full-length version of the SAME title is (remix/cover/translate). The title
  // must match as a whole phrase – "Anti-Hero" is NOT Skillet's "Hero", and
  // "The Tea Shop" is NOT Undertale's "Shop".
  const JUNK = /x2download|muzati|\.com|whatsapp|sound effect|stock audio|tutorial|sight-?read|sheet music|karaoke|8 ?bit|slowed|sped up|nightcore/i;
  const wantCore = core.toLowerCase();
  for (const q of queries) {
    const pool = await searchTracks(q, 10).catch(() => [] as Song[]);
    const ranked = pool
      .map((song) => {
        const candCore = titleWithoutArtist(song.title, song.artist).toLowerCase();
        const extra = candCore.startsWith(wantCore) ? candCore.slice(wantCore.length).trim().split(/\s+/).filter(Boolean).length : 99;
        const exact = candCore === wantCore;
        const near = candCore.startsWith(`${wantCore} `) && extra <= 2;
        return { song, ok: (exact || near) && !JUNK.test(song.title || "") && (song.duration || 0) >= 60, rank: exact ? 0 : 1 };
      })
      .filter((c) => c.ok)
      .sort((a, b) => a.rank - b.rank);
    if (ranked[0]) return { song: ranked[0].song, kind: "alternative" };
  }
  return null;
}

function mirrorHeaders(song: { title: string; artist: string }) {
  return {
    "X-Calamify-Source": "newgrounds-mirror",
    "X-Calamify-Title": encodeURIComponent(song.title),
    "X-Calamify-Artist": encodeURIComponent(song.artist),
  };
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */
export async function getAudioResponse(rawId: string, opts: AudioOptions = {}): Promise<Response> {
  const { source, ref } = parseSongId(rawId);
  const { range, title, artist, warm, alt } = opts;

  // Warm-up requests only resolve the upstream (never download a whole file).
  if (warm) {
    if (source === "audius") {
      await resolveStreamUrl(ref).catch(() => null);
    } else {
      void ensureYouTubeFile(ref);
    }
    return new Response(null, { status: 204, headers: corsHeaders({ "X-Calamify-Source": "warm" }) });
  }

  if (source === "audius") {
    if (alt) streamCacheClear(ref);
    const res = await proxyAudius(ref, range, { "X-Calamify-Source": "audius" });
    if (res) return res;
    return Response.json({ error: "Stream unavailable" }, { status: 502, headers: corsHeaders() });
  }

  // --- Newgrounds Audio Portal (incl. Geometry Dash OST) ------------
  if (source === "newgrounds") {
    return deliverNewgrounds(ref, range, title, artist);
  }

  // --- القرآن الكريم (full-surah audio, Range supported) ------------
  if (source === "quran") {
    const { getQuranAudioUrl, DEFAULT_RECITER } = await import("./sources/quran");
    const [reciterId, surahRaw] = ref.split(":");
    const surah = parseInt(surahRaw || "", 10);
    const reciter = reciterId || DEFAULT_RECITER;
    if (!isNaN(surah) && surah >= 1 && surah <= 114) {
      for (const bitrate of [128, 64]) {
        const res = await proxyUpstream(getQuranAudioUrl(reciter, surah, bitrate), range, {}, {
          "X-Calamify-Source": "quran",
          "Cache-Control": "public, max-age=604800",
        });
        if (res) return res;
      }
      // last resort: the default reciter always has every surah
      if (reciter !== DEFAULT_RECITER) {
        const res = await proxyUpstream(getQuranAudioUrl(DEFAULT_RECITER, surah, 128), range, {}, { "X-Calamify-Source": "quran-fallback" });
        if (res) return res;
      }
    }
    return Response.json({ error: "Quran audio unavailable for that reciter/surah" }, { status: 502, headers: corsHeaders() });
  }

  // --- YouTube path -------------------------------------------------
  if (alt) {
    const memo = fileIndex.get(ref);
    if (memo && !memo.path.includes(".partial.")) return serveFile(memo.path, memo.size, memo.mime, range, { "X-Calamify-Source": "youtube" });
  }

  // Known good stand-in from an earlier attempt → serve instantly (keeps
  // seeking snappy even when the upstream YouTube URL is throttled).
  const knownFallback = fallbackIndex.get(ref);
  if (knownFallback && !alt) {
    const label = knownFallback.kind === "alternative" ? "audius-alternative" : "audius-fallback";
    const res = await proxyAudius(knownFallback.auId, range, {
      "X-Calamify-Source": label,
      "X-Calamify-Title": encodeURIComponent(knownFallback.title),
      "X-Calamify-Artist": encodeURIComponent(knownFallback.artist),
    });
    if (res) return res;
    fallbackIndex.delete(ref);
  }

  const dlPromise = ensureYouTubeFile(ref);

  const withTimeout = Promise.race([
    dlPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), MAX_DL_MS + 2000)),
  ]);
  const dl = await withTimeout;

  if (dl?.complete) {
    return serveFile(dl.path, dl.size, dl.mime, range, { "X-Calamify-Source": "youtube" });
  }

  // --- Fallback: full-length Audius match for the same song ---------
  let metaTitle = title || "";
  let metaArtist = artist || "";
  if (!metaTitle || !metaArtist) {
    const meta: Song | null = await getVideoMeta(ref);
    metaTitle = metaTitle || meta?.title || "";
    metaArtist = metaArtist || meta?.artist || "";
  }
  if (metaTitle) {
    // a full-length stand-in beats a one-minute throttled fragment
    const match = await findAudiusMatch(metaTitle, metaArtist);
    if (match) {
      fallbackIndex.set(ref, { auId: match.song.id.slice(3), title: match.song.title, artist: match.song.artist, kind: match.kind });
      const res = await proxyAudius(match.song.id.slice(3), range, {
        "X-Calamify-Source": match.kind === "alternative" ? "audius-alternative" : "audius-fallback",
        "X-Calamify-Title": encodeURIComponent(match.song.title),
        "X-Calamify-Artist": encodeURIComponent(match.song.artist),
      });
      if (res) return res;
    }
  }

  // --- Last resort: whatever YouTube handed over --------------------
  if (dl && !dl.complete && dl.size > 128 * 1024) {
    return serveFile(dl.path, dl.size, dl.mime, range, {
      "X-Calamify-Source": "youtube-partial",
    });
  }

  return Response.json({ error: "Audio unavailable" }, { status: 502, headers: corsHeaders() });
}

function streamCacheClear(videoId: string) {
  fileIndex.delete(videoId);
}

function cleanForSearch(value: string) {
  return value.replace(/\(.*?\)|\[.*?\]/g, " ").replace(/official (audio|video|music video)/gi, " ").replace(/\s+/g, " ").trim();
}
