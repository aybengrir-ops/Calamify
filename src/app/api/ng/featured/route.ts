import { ngFeaturedSummaries, NG_FEATURED_PLAYLISTS } from "@/lib/sources/newgrounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The 13 hand-picked Newgrounds collections (metadata only). */
export async function GET() {
  return Response.json({ playlists: ngFeaturedSummaries(), count: NG_FEATURED_PLAYLISTS.length });
}
