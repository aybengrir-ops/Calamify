import { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { toggleLike } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to like songs" }, { status: 401 });
  const body = await req.json();
  const song = body.song as Song;
  const liked = Boolean(body.liked);
  if (!song?.id) return Response.json({ error: "Song is required" }, { status: 400 });
  await toggleLike(userId, song, liked);
  return Response.json({ ok: true, liked });
}
