import { NextRequest } from "next/server";
import { getNCSPlaylist, ncsCollections } from "@/lib/sources/ncs";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tracks of an NCS playlist (or a live NCS genre feed). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const playlistId = decodeURIComponent(id);
  const meta = ncsCollections().find((c) => c.id === playlistId);
  const tracks = await getNCSPlaylist(playlistId, 60);
  await cacheSongs(tracks);
  return Response.json({
    playlist: {
      id: playlistId,
      name: meta?.name || "NCS playlist",
      description: meta?.description || "Copyright-free music from NoCopyrightSounds",
      icon: meta?.icon || "🎵",
      copyright: "FREE — NoCopyrightSounds",
    },
    tracks,
    totalDuration: tracks.reduce((a, b) => a + (b.duration || 0), 0),
  });
}
