import { NextRequest } from "next/server";
import { getTopCharts, isReachable } from "@/lib/sources/newgrounds";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Weekly / monthly / all-time most popular Newgrounds tracks. */
export async function GET(req: NextRequest) {
  const period = new URL(req.url).searchParams.get("period") || "weekly";
  const tracks = await getTopCharts({ period });
  await cacheSongs(tracks);
  return Response.json({ period, tracks, reachable: await isReachable(), source: tracks[0]?.provider === "ng" ? "newgrounds" : "mirror" });
}
