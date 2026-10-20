import { NextRequest } from "next/server";
import { searchYouTube, getSuggestions } from "@/lib/innertube";
import { searchTracks } from "@/lib/audius";
import { searchNCS } from "@/lib/sources/ncs";
import { searchGDCurated } from "@/lib/sources/geometrydash";
import { getSurahs, surahToSong, getReciters, findSurahs, DEFAULT_RECITER } from "@/lib/sources/quran";
import { cacheSongs, logSearch, searches } from "@/lib/data";
import { searchLocalTracks } from "@/lib/catalogData";
import { resolveLocalMatches } from "@/lib/sources/catalog";
import { getSessionUserId } from "@/lib/auth";
import { collapseReuploads, dedupeSongs, type Song } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ARABIC_RE = /[\u0600-\u06FF]/;
const NASHEED_HINTS = /nasheed|nasheeds|anachid|نشيد|أناشيد|اناشيد|مديح|دعاء|أذكار|اذكار|قرآن|قران|quran|surah|سورة/i;

/** Match surahs by Arabic name, transliteration, translation or number. */
async function matchSurahs(query: string, reciterId: string, limit = 8): Promise<Song[]> {
  const q = query.trim();
  if (!q) return [];
  const wantsQuran = NASHEED_HINTS.test(q) && /quran|قرآن|قران|surah|سورة|ayat|آية/i.test(q);
  const surahs = await getSurahs();
  const reciters = await getReciters();
  const reciter = reciters.find((r) => r.id === reciterId) || reciters.find((r) => r.id === DEFAULT_RECITER) || reciters[0];
  if (!reciter) return [];

  const hits = findSurahs(surahs, q, limit);
  const final = hits.length ? hits : wantsQuran ? surahs.slice(0, limit) : [];
  return final.map((s) => surahToSong(s, reciter));
}

/**
 * Universal search across every source at once:
 *   · القرآن الكريم (surahs by Arabic / English name or number)
 *   · Innertube (YouTube) – the complete real-world catalogue
 *   · Audius              – guaranteed full-length streams
 *   · NCS                 – copyright-free electronic music
 *   · Geometry Dash OST   – Creative Commons level themes
 *   · أناشيد              – nasheeds & Arabic poetry
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const mode = url.searchParams.get("mode") || "all";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "24", 10) || 24, 50);
  if (!q) return Response.json({ results: [], suggestions: [], counts: {} });

  const scoped = mode === "youtube" || mode === "audius";
  const wantsNasheed = ARABIC_RE.test(q) || NASHEED_HINTS.test(q);

  const [catalog, quran, yt, audius, ncs, gd, nasheed, suggestions] = await Promise.all([
    scoped ? Promise.resolve([] as Song[]) : resolveLocalMatches(searchLocalTracks(q, 2)).catch(() => [] as Song[]),
    scoped ? Promise.resolve([] as Song[]) : matchSurahs(q, DEFAULT_RECITER).catch(() => [] as Song[]),
    mode === "audius" ? Promise.resolve([] as Song[]) : searchYouTube(q, limit),
    mode === "youtube" ? Promise.resolve([] as Song[]) : searchTracks(q, 10),
    scoped ? Promise.resolve([] as Song[]) : searchNCS(q, 8).catch(() => [] as Song[]),
    scoped ? Promise.resolve([] as Song[]) : searchGDCurated(q, 4).catch(() => [] as Song[]),
    scoped || !wantsNasheed
      ? Promise.resolve([] as Song[])
      : searchYouTube(`${q} نشيد`, 6)
          .then((r) => r.map((s) => ({ ...s, genre: "Nasheed", copyright: "FREE — nasheed" })))
          .catch(() => [] as Song[]),
    getSuggestions(q).catch(() => [] as string[]),
  ]);

  // Quran first (exact, authoritative), then copyright-free, then the full index.
  // dedupeSongs also drops the same recording reached through two sources.
  const results: Song[] = dedupeCanonical(collapseReuploads([...catalog, ...quran, ...gd, ...ncs, ...audius, ...yt, ...nasheed])).kept;

  await cacheSongs(results);
  const userId = await getSessionUserId();
  if (userId && q.length > 2) void logSearch(userId, q);
  const history = userId ? await searches(userId, 8).catch(() => []) : [];

  return Response.json({
    results: results.slice(0, limit + 20),
    catalog,
    quran,
    nasheed,
    suggestions,
    history: history.map((h) => h.query),
    counts: {
      catalog: catalog.length,
      quran: quran.length,
      youtube: yt.length,
      audius: audius.length,
      ncs: ncs.length,
      geometrydash: gd.length,
      nasheed: nasheed.length,
      total: results.length,
    },
  });
}
