import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/innertube";
import { searchTracks, trendingTracks } from "@/lib/audius";
import { GENRES, genreBySlug } from "@/lib/catalog";
import { cacheSongs } from "@/lib/data";
import { type Song } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Discovery feed: charts, genre pages, moods and curated mixes all run here.
 * Audius results (guaranteed full-length) are interleaved with Innertube hits.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("query") || "").trim();
  const genreSlug = (url.searchParams.get("genre") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "24", 10) || 24, 50);

  const genre = genreSlug ? genreBySlug(genreSlug) : null;
  const effectiveQuery = query || genre?.query || "top hits 2026";

  const [yt, audius, trending] = await Promise.all([
    searchYouTube(effectiveQuery, limit).catch(() => [] as Song[]),
    searchTracks(effectiveQuery, 10).catch(() => [] as Song[]),
    genre?.audiusGenre
      ? trendingTracks({ genre: genre.audiusGenre, limit: 12 }).catch(() => [] as Song[])
      : trendingTracks({ limit: 12 }).catch(() => [] as Song[]),
  ]);

  const pool = (query || genreSlug ? [...audius, ...yt, ...trending] : [...trending, ...audius, ...yt]).map((s) => ({
    ...s,
    genre: s.genre || genre?.name,
  }));
  const merged: Song[] = dedupeCanonical(pool).kept;
  await cacheSongs(merged.slice(0, limit + 12));

  return Response.json({
    results: merged.slice(0, limit + 12),
    genre: genre
      ? { name: genre.name, slug: genre.slug, icon: genre.icon, description: genre.description, from: genre.from, to: genre.to }
      : null,
    genres: GENRES.map((g) => ({ name: g.name, slug: g.slug, icon: g.icon })),
  });
}
