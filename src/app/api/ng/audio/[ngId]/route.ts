import { NextRequest } from "next/server";
import { getAudioResponse } from "@/lib/audio-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Newgrounds audio proxy — Range aware, 24h cacheable, same-origin.
 * Falls back to a full-length mirror automatically when NG Guard blocks us.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ ngId: string }> }) {
  const { ngId } = await ctx.params;
  const url = new URL(req.url);
  try {
    return await getAudioResponse(`ng:${ngId}`, {
      range: req.headers.get("range"),
      title: url.searchParams.get("title") || undefined,
      artist: url.searchParams.get("artist") || undefined,
      alt: url.searchParams.get("alt") === "1",
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Audio streaming failed" }, { status: 502 });
  }
}
