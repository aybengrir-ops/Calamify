import { NextRequest } from "next/server";
import { getAudioResponse } from "@/lib/audio-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Full-surah audio, proxied through our own origin with Range support so
 * seeking works and no CDN URL reaches the browser.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ reciterId: string; surah: string }> }) {
  const { reciterId, surah } = await ctx.params;
  try {
    return await getAudioResponse(`qr:${decodeURIComponent(reciterId)}:${surah}`, {
      range: req.headers.get("range"),
      alt: new URL(req.url).searchParams.get("alt") === "1",
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Quran audio not available" }, { status: 502 });
  }
}
