import { NextRequest } from "next/server";
import { GD_SONGS, getGDSongs, searchGD, probeNewgrounds, getNewgroundsAudioUrl } from "@/lib/sources/geometrydash";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

/**
 * Geometry Dash soundtrack. Every level theme is resolved to a real,
 * full-length stream. `?q=` searches levels/artists; `?meta=1` returns the
 * curated level list with Newgrounds reachability info.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "34", 10) || 34, 60);

  if (url.searchParams.get("meta") === "1") {
    return Response.json({
      levels: GD_SONGS.map((s) => ({ ...s, newgroundsUrl: getNewgroundsAudioUrl(s.ngId), copyright: "FREE — Creative Commons (Newgrounds)" })),
    });
  }

  const songs = q ? await searchGD(q, limit) : await getGDSongs(limit);
  await cacheSongs(songs);
  return Response.json({
    results: songs,
    source: "geometrydash",
    copyright: "FREE — Creative Commons (Newgrounds)",
    levels: GD_SONGS.length,
  });
}

export async function HEAD(req: NextRequest) {
  const ngId = parseInt(new URL(req.url).searchParams.get("ngId") || "0", 10);
  const reachable = ngId ? await probeNewgrounds(ngId) : false;
  return new Response(null, { status: reachable ? 200 : 404 });
}
