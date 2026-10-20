import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

import { parseLrc, synthesizeWordTimings } from "@/lib/lyrics";

const clean = (v: string) =>
  v
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/official (audio|video|music video)|lyric video|\bNCS\b|copyright free|no copyright/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------------- source 1: lrclib (synced LRC) ---------------- */
async function lrclib(artist: string, title: string) {
  const t = clean(title);
  const a = clean(artist);
  const endpoints = [
    `https://lrclib.net/api/get?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(a)}`,
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(a)}`,
    `https://lrclib.net/api/search?q=${encodeURIComponent(`${t} ${a}`.trim())}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(9000), headers: { "User-Agent": "Calamify/1.0" } });
      if (!r.ok) continue;
      const data = await r.json();
      const entry = Array.isArray(data) ? data.find((d: any) => d?.syncedLyrics) || data[0] : data;
      if (!entry) continue;
      const synced: string = entry.syncedLyrics || "";
      const plain: string = entry.plainLyrics || synced.replace(/\[\d+:\d+(?:\.\d+)?\]\s*/g, "");
      if (!plain && !synced) continue;
      return { plain, synced, source: "lrclib", title: entry.trackName || title, artist: entry.artistName || artist, duration: entry.duration || 0 };
    } catch {
      /* next endpoint */
    }
  }
  return null;
}

/* ---------------- source 2: lyrics.ovh (plain) ---------------- */
async function lyricsOVH(artist: string, title: string) {
  try {
    const r = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(clean(artist))}/${encodeURIComponent(clean(title))}`, {
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const plain: string = (data?.lyrics || "").trim();
    if (!plain || plain.length < 20) return null;
    return { plain, synced: "", source: "lyrics.ovh", title, artist };
  } catch {
    return null;
  }
}

/* ---------------- source 3: Genius (needs GENIUS_API_KEY) ---------------- */
async function geniusFallback(artist: string, title: string) {
  const key = process.env.GENIUS_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(`${clean(title)} ${clean(artist)}`)}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const hit = data?.response?.hits?.[0]?.result;
    if (!hit) return null;
    return {
      plain: `${hit.title_with_featured || hit.title}\n${hit.primary_artist?.name || artist}\n\nOpen on Genius for the full text:\n${hit.url}`,
      synced: "",
      source: "genius",
      title: hit.title || title,
      artist: hit.primary_artist?.name || artist,
      url: hit.url,
    };
  } catch {
    return null;
  }
}

/**
 * Lyrics with three fallbacks (lrclib → lyrics.ovh → Genius), always proxied
 * through our backend so no third-party origin touches the browser.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const title = (url.searchParams.get("title") || "").trim();
  const artist = (url.searchParams.get("artist") || "").trim();
  if (!title) return Response.json({ found: false, lyrics: [], plain: "", source: "none" });

  for (const source of [lrclib, lyricsOVH, geniusFallback]) {
    const result = await source(artist, title).catch(() => null);
    if (!result) continue;
    const parsed = result.synced ? parseLrc(result.synced) : [];
    // word timings ship with the payload so the UI can highlight karaoke-style
    const withWords = parsed.length ? synthesizeWordTimings(parsed) : [];
    return Response.json({
      found: true,
      lyrics: withWords,
      synced: parsed.length ? parsed : null,
      wordTimed: withWords.some((l) => l.wordsAreExact),
      plain: result.plain,
      source: result.source,
      title: result.title,
      artist: result.artist,
    });
  }

  return Response.json({ found: false, lyrics: [], synced: null, plain: "", source: "none", title, artist });
}
