import { NextRequest } from "next/server";
import { searchNewgrounds, mirrorGenre, NG_GENRES, isReachable, NG_COPYRIGHT } from "@/lib/sources/newgrounds";
import { searchTracks } from "@/lib/audius";
import { cacheSongs } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Search the Newgrounds Audio Portal (2M+ copyright-free submissions). */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
  const genre = url.searchParams.get("genre") || null;
  const sort = (url.searchParams.get("sort") as "score" | "date" | "views") || "score";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "24", 10) || 24, 50);
  if (!q) return Response.json({ error: "Query required" }, { status: 400 });

  let results = await searchNewgrounds(q, { page, genre, sort });
  const reachable = results.length > 0;

  if (!results.length) {
    // Mirror the intent so the search box never returns nothing playable.
    const genreInfo = genre ? NG_GENRES[genre] : null;
    const [audius, mirrored] = await Promise.all([
      searchTracks(`${q} ${genreInfo?.name || ""}`.trim(), Math.ceil(limit / 2)).catch(() => [] as Song[]),
      genreInfo ? mirrorGenre(genreInfo, Math.ceil(limit / 2)) : Promise.resolve([] as Song[]),
    ]);
    const seen = new Set<string>();
    for (const s of [...audius, ...mirrored]) {
      if (!s?.id || seen.has(s.id)) continue;
      seen.add(s.id);
      results.push({ ...s, copyright: s.copyright || NG_COPYRIGHT, genre: s.genre || genreInfo?.name || "Newgrounds" });
      if (results.length >= limit) break;
    }
  }

  await cacheSongs(results);
  return Response.json({ results: results.slice(0, limit), reachable, source: reachable ? "newgrounds" : "mirror", page, sort });
}
