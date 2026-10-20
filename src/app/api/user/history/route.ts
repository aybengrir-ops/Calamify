import { NextRequest } from "next/server";
import { db } from "@/db";
import { history } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { pushHistory, recentHistory } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_SECONDS = 10;

/** GET – listening history (most recent first, de-duplicated per track). */
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ history: [], anonymous: true });
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") || "100", 10) || 100, 200);
  return Response.json({ history: await recentHistory(userId, limit) });
}

/** POST – record a play. Only counts when the listener actually heard it (>10s). */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ ok: false, anonymous: true });
  const body = await req.json().catch(() => ({}));
  const incoming: { song: Song; seconds: number }[] = Array.isArray(body.items)
    ? body.items
    : [{ song: body.song as Song, seconds: Number(body.seconds || body.durationPlayed || 0) }];
  let recorded = 0;
  for (const item of incoming) {
    if (!item?.song?.id) continue;
    const seconds = Math.max(0, Number(item.seconds) || 0);
    if (seconds < MIN_SECONDS) continue;
    await pushHistory(userId, item.song, seconds);
    recorded++;
  }
  return Response.json({ ok: true, recorded, minSeconds: MIN_SECONDS });
}

/** DELETE – clear the whole history. */
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  await db.delete(history).where(eq(history.userId, userId));
  return Response.json({ ok: true, cleared: true });
}
