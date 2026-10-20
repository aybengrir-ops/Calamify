import { NextRequest } from "next/server";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { cacheSongs, userDownloads } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side registry of what this account has stored offline. The audio
 * itself lives in the browser's IndexedDB (it is never re-uploaded), so this
 * table only keeps the list in sync across devices.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ downloads: [], anonymous: true });
  return Response.json({ downloads: await userDownloads(userId) });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ ok: false, anonymous: true });
  const body = await req.json().catch(() => ({}));
  const song = body.song as Song;
  if (!song?.id) return Response.json({ error: "song is required" }, { status: 400 });
  await cacheSongs([song]);
  await db.insert(downloads).values({ userId, songId: song.id }).onConflictDoNothing();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ ok: false, anonymous: true });
  const songId = new URL(req.url).searchParams.get("songId");
  if (songId) await db.delete(downloads).where(and(eq(downloads.userId, userId), eq(downloads.songId, songId)));
  else await db.delete(downloads).where(eq(downloads.userId, userId));
  return Response.json({ ok: true });
}
