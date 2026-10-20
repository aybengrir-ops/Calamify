import { NextRequest } from "next/server";
import { db } from "@/db";
import { history } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { pushHistory, recentHistory } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ ok: false, anonymous: true });
  const body = await req.json();
  const song = body.song as Song;
  if (!song?.id) return Response.json({ error: "Song is required" }, { status: 400 });
  await pushHistory(userId, song, Number(body.seconds || 0));
  return Response.json({ ok: true });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ history: [] });
  return Response.json({ history: await recentHistory(userId, 100) });
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  await db.delete(history).where(eq(history.userId, userId));
  return Response.json({ ok: true });
}
