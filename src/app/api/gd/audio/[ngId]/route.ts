import { NextRequest } from "next/server";
import { getAudioResponse } from "@/lib/audio-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Proxies Newgrounds audio for a Geometry Dash track through our own origin. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ ngId: string }> }) {
  const { ngId } = await ctx.params;
  try {
    return await getAudioResponse(`ng:${ngId}`, { range: req.headers.get("range") });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "audio failed" }, { status: 502 });
  }
}
