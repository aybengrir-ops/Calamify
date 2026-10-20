import { NextRequest } from "next/server";
import { getCollection, getCollectionTracks } from "@/lib/sources/collections";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tracks of one curated copyright-free collection. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const collection = getCollection(decodeURIComponent(key));
  if (!collection) return Response.json({ error: "Unknown collection" }, { status: 404 });

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") || "30", 10) || 30, 60);
  const tracks = await getCollectionTracks(collection.key, limit);
  await cacheSongs(tracks);

  return Response.json({
    collection: { key: collection.key, name: collection.name, nameEn: collection.nameEn, description: collection.description, icon: collection.icon, from: collection.from, to: collection.to, group: collection.group, copyright: collection.copyright },
    tracks,
    count: tracks.length,
    totalDuration: tracks.reduce((a, b) => a + (b.duration || 0), 0),
  });
}
