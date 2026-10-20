import { NextRequest } from "next/server";
import { trendingTracks } from "@/lib/audius";
import { resolveSection } from "@/lib/sources/catalog";
import { getSection, ALL_SECTIONS } from "@/lib/catalogData";
import { likedSongs, recentHistory } from "@/lib/data";
import { getSessionUserId } from "@/lib/auth";
import { dedupeCanonical } from "@/lib/dedupe";
import { cacheSongs } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Recognition corpus — curated Calamify catalogue ONLY (never a live internet
 * search). Nothing is computed at build/deploy time: sections are resolved on
 * demand and the browser fingerprints + caches them lazily in IndexedDB.
 *
 * Scopes: `catalog` (a section, or a mix of sections), `library` (likes +
 * history), `trending`.
 */
export async function GET(req: NextRequest) {
  const started = Date.now();
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "catalog";
  const sectionId = url.searchParams.get("section") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "18", 10) || 18, 40);

  let songs: Song[] = [];

  if (scope === "trending") {
    songs = await trendingTracks({ limit }).catch(() => []);
  } else if (scope === "library") {
    const userId = await getSessionUserId();
    if (userId) {
      const [likes, hist] = await Promise.all([likedSongs(userId).catch(() => []), recentHistory(userId, limit).catch(() => [])]);
      songs = [...likes, ...hist.map((h) => h.song)].slice(0, limit * 2);
    }
  } else if (sectionId && getSection(sectionId)) {
    songs = await resolveSection(sectionId, limit).catch(() => []);
  } else {
    // round-robin across the curated shelves so the default corpus is varied
    const perSection = Math.max(2, Math.ceil(limit / Math.min(6, ALL_SECTIONS.length)));
    const batches = await Promise.all(
      ALL_SECTIONS.slice(0, 6).map((s) => resolveSection(s.id, perSection).catch(() => [] as Song[]))
    );
    songs = batches.flat();
  }

  const { kept, removed } = dedupeCanonical(songs);
  const corpus = kept.slice(0, limit);
  await cacheSongs(corpus);

  return Response.json({
    scope,
    section: sectionId || null,
    songs: corpus,
    count: corpus.length,
    duplicatesRemoved: removed.length,
    sections: ALL_SECTIONS.map((s) => ({ id: s.id, title: s.title, icon: s.icon, entries: s.entries.length })),
    timings: { corpusMs: Date.now() - started },
  });
}
