import { NextRequest } from "next/server";
import { getNewgroundsSong, getNewgroundsAudioUrl, getNewgroundsIconUrl } from "@/lib/sources/newgrounds";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Metadata + resolved stream URL for one Newgrounds submission. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ ngId: string }> }) {
  const { ngId } = await ctx.params;
  const url = new URL(req.url);
  const info = await getNewgroundsSong(ngId, { title: url.searchParams.get("title") || undefined, artist: url.searchParams.get("artist") || undefined });
  if (!info) return Response.json({ error: "Submission not found" }, { status: 404 });
  await cacheSongs([info]);
  return Response.json({
    ...info,
    audioUrl: `/api/ng/audio/${ngId}`,
    candidateCdnUrl: getNewgroundsAudioUrl(ngId, info.slug),
    iconUrl: getNewgroundsIconUrl(ngId),
    proxyUrl: `/api/audio/${encodeURIComponent(`ng:${ngId}`)}`,
  });
}
