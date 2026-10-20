import { NextRequest } from "next/server";
import { getAudioResponse } from "@/lib/audio-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * THE key endpoint. The <audio> element only ever sees this URL (same origin),
 * so there are no CORS problems and no Google CDN URLs leak to the browser.
 * Full-length streams, HTTP Range support (seeking), automatic fallback.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ songId: string }> }) {
  const { songId } = await ctx.params;
  const url = new URL(req.url);
  try {
    return await getAudioResponse(decodeURIComponent(songId), {
      range: req.headers.get("range"),
      title: url.searchParams.get("title") || undefined,
      artist: url.searchParams.get("artist") || undefined,
      warm: url.searchParams.get("warm") === "1",
      alt: url.searchParams.get("alt") === "1",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "stream failed";
    return Response.json({ error: message }, { status: 502 });
  }
}

/**
 * HEAD resolves exactly what GET would serve (including any provider
 * fallback) so the player can tell the listener which source is playing.
 */
export async function HEAD(req: NextRequest, ctx: { params: Promise<{ songId: string }> }) {
  const { songId } = await ctx.params;
  const url = new URL(req.url);
  if (url.searchParams.get("warm") === "1") {
    await getAudioResponse(decodeURIComponent(songId), { warm: true });
    return new Response(null, { status: 204 });
  }
  const res = await getAudioResponse(decodeURIComponent(songId), {
    range: "bytes=0-0",
    title: url.searchParams.get("title") || undefined,
    artist: url.searchParams.get("artist") || undefined,
  });
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-range");
  await res.body?.cancel().catch(() => undefined);
  return new Response(null, { status: res.status, headers });
}
