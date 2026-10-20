import { NextRequest } from "next/server";
import { getNgFeaturedPlaylist } from "@/lib/sources/newgrounds";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

/** Tracks of one featured Newgrounds collection. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await ctx.params;
  const data = await getNgFeaturedPlaylist(decodeURIComponent(playlistId), 40);
  if (!data) return Response.json({ error: "Playlist not found" }, { status: 404 });
  await cacheSongs(data.tracks);
  return Response.json({
    id: data.playlist.id,
    name: data.playlist.name,
    description: data.playlist.description,
    icon: data.playlist.icon,
    from: data.playlist.from,
    to: data.playlist.to,
    tracks: data.tracks,
    reachable: data.reachable,
    source: data.tracks[0]?.provider === "ng" ? "newgrounds" : "mirror",
    totalDuration: data.tracks.reduce((a, b) => a + (b.duration || 0), 0),
  });
}
