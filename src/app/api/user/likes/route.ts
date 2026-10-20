import { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { likedSongs, toggleLike } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET – hydrate the player store with the account's liked songs. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ likes: [], anonymous: true });
  const songs = await likedSongs(userId);
  return Response.json({ likes: songs, count: songs.length });
}

/** POST – like a track (accepts one song or a batch for guest→cloud sync). */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to sync likes" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const incoming: Song[] = Array.isArray(body.songs) ? body.songs : body.song ? [body.song as Song] : [];
  const valid = incoming.filter((s) => s?.id);
  if (!valid.length) return Response.json({ error: "song (or songs[]) is required" }, { status: 400 });
  for (const song of valid) await toggleLike(userId, song, true);
  return Response.json({ ok: true, liked: true, added: valid.length, likes: await likedSongs(userId) });
}

/** DELETE – unlike one track (?songId=) or every liked track. */
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const url = new URL(req.url);
  const songId = url.searchParams.get("songId");
  if (songId) {
    await toggleLike(userId, { id: songId } as Song, false);
    return Response.json({ ok: true, liked: false, removed: songId });
  }
  const all = await likedSongs(userId);
  for (const song of all) await toggleLike(userId, song, false);
  return Response.json({ ok: true, cleared: all.length });
}
