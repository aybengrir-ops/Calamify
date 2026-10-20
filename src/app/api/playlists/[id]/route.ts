import { NextRequest } from "next/server";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { playlistWithSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  const data = await playlistWithSongs(userId, id);
  if (!data || !data.visible) return Response.json({ error: "Playlist not found" }, { status: 404 });
  return Response.json({ playlist: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.isPublic === "boolean") patch.isPublic = body.isPublic;
  if (typeof body.isCollaborative === "boolean") patch.isCollaborative = body.isCollaborative;
  if (typeof body.coverUrl === "string") patch.coverUrl = body.coverUrl;
  if (typeof body.coverSeed === "string") patch.coverSeed = body.coverSeed;
  const [updated] = await db.update(playlists).set(patch).where(and(eq(playlists.id, id), eq(playlists.userId, userId))).returning();
  if (!updated) return Response.json({ error: "Playlist not found" }, { status: 404 });
  return Response.json({ playlist: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const deleted = await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId))).returning();
  if (!deleted[0]) return Response.json({ error: "Playlist not found" }, { status: 404 });
  return Response.json({ ok: true });
}
