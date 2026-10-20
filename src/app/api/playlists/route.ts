import { NextRequest } from "next/server";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { userPlaylists, pushNotification } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ playlists: [] });
  return Response.json({ playlists: await userPlaylists(userId) });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to create playlists" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return Response.json({ error: "Playlist name is required" }, { status: 400 });
  const [created] = await db
    .insert(playlists)
    .values({
      userId,
      name,
      description: String(body.description || ""),
      isPublic: body.isPublic !== false,
      isCollaborative: Boolean(body.isCollaborative),
      coverSeed: String(body.coverSeed || name.toLowerCase().replace(/\s+/g, "-")).slice(0, 60),
      coverUrl: body.coverUrl || null,
    })
    .returning();
  await pushNotification(userId, { type: "playlist", title: `Playlist "${name}" created`, body: "Start adding tracks from any song menu.", link: `/playlist/${created.id}` });
  return Response.json({ playlist: created });
}
