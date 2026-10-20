import { NextRequest } from "next/server";
import { browseByGenre, NG_GENRES, isReachable } from "@/lib/sources/newgrounds";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Browse a Newgrounds genre (score / date / views). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ genreKey: string }> }) {
  const { genreKey } = await ctx.params;
  const key = decodeURIComponent(genreKey);
  if (!NG_GENRES[key]) return Response.json({ error: "Unknown genre", available: Object.keys(NG_GENRES) }, { status: 404 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
  const sort = url.searchParams.get("sort") || "score";

  const result = await browseByGenre(key, { page, sort });
  await cacheSongs(result.tracks);
  return Response.json({
    genreKey: key,
    genre: result.genre,
    icon: NG_GENRES[key].icon,
    tracks: result.tracks,
    page,
    sort,
    reachable: await isReachable(),
    totalDuration: result.tracks.reduce((a, b) => a + (b.duration || 0), 0),
  });
}
