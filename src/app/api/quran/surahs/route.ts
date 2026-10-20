import { NextRequest } from "next/server";
import { getSurahs, getSurahSongs, DEFAULT_RECITER } from "@/lib/sources/quran";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** All 114 surahs. `?tracks=1&reciter=` returns playable Song objects. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reciter = url.searchParams.get("reciter") || DEFAULT_RECITER;
  const surahs = await getSurahs();

  if (url.searchParams.get("tracks") === "1") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "114", 10) || 114, 114);
    const tracks = await getSurahSongs(reciter, limit);
    await cacheSongs(tracks);
    return Response.json({ surahs, tracks, reciter, count: tracks.length, source: "alquran.cloud" });
  }

  return Response.json({ surahs, count: surahs.length, source: "alquran.cloud" });
}
