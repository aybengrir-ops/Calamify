import { ngGenreList, isReachable } from "@/lib/sources/newgrounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** All 32 Newgrounds Audio Portal genres. */
export async function GET() {
  const reachable = await isReachable();
  return Response.json({
    genres: ngGenreList(),
    count: ngGenreList().length,
    reachable,
    note: reachable ? "Live Newgrounds index" : "Newgrounds is refusing datacenter traffic (NG Guard) — serving resolved full-length mirrors",
  });
}
