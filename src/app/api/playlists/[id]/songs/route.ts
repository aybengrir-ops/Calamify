import { NextRequest } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { cacheSongs, playlistWithSongs } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertOwner(playlistId: string, userId: string) {
  const [pl] = await db.select().from(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId))).limit(1);
  return pl || null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!(await assertOwner(id, userId))) return Response.json({ error: "Playlist not found" }, { status: 404 });

  const body = await req.json();
  const incoming: Song[] = Array.isArray(body.songs) ? body.songs : body.song ? [body.song as Song] : [];
  const valid = incoming.filter((s) => s?.id);
  if (!valid.length) return Response.json({ error: "No songs supplied" }, { status: 400 });

  await cacheSongs(valid);
  const [last] = await db
    .select({ position: playlistSongs.position })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, id))
    .orderBy(desc(playlistSongs.position))
    .limit(1);
  let position = (last?.position ?? -1) + 1;

  for (const song of valid) {
    await db.insert(playlistSongs).values({ playlistId: id, songId: song.id, position: position++ }).onConflictDoNothing();
  }
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, id));
  return Response.json({ ok: true, playlist: await playlistWithSongs(userId, id) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!(await assertOwner(id, userId))) return Response.json({ error: "Playlist not found" }, { status: 404 });
  const songId = new URL(req.url).searchParams.get("songId") || "";
  if (!songId) return Response.json({ error: "songId is required" }, { status: 400 });
  await db.delete(playlistSongs).where(and(eq(playlistSongs.playlistId, id), eq(playlistSongs.songId, songId)));
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, id));
  return Response.json({ ok: true, playlist: await playlistWithSongs(userId, id) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!(await assertOwner(id, userId))) return Response.json({ error: "Playlist not found" }, { status: 404 });
  const body = await req.json();
  const order: string[] = Array.isArray(body.order) ? body.order : [];
  for (let i = 0; i < order.length; i++) {
    await db.update(playlistSongs).set({ position: i }).where(and(eq(playlistSongs.playlistId, id), eq(playlistSongs.songId, order[i])));
  }
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, id));
  return Response.json({ ok: true, playlist: await playlistWithSongs(userId, id) });
}
