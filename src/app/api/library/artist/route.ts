import { NextRequest } from "next/server";
import { db } from "@/db";
import { followedArtists as followedArtistsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { pushNotification } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to follow artists" }, { status: 401 });
  const body = await req.json();
  const artistName = String(body.artistName || "").trim();
  if (!artistName) return Response.json({ error: "artistName is required" }, { status: 400 });
  await db
    .insert(followedArtistsTable)
    .values({ userId, artistName, thumbnail: body.thumbnail || "", listeners: body.listeners || "0" })
    .onConflictDoNothing();
  await pushNotification(userId, {
    type: "artist",
    title: `You are now following ${artistName}`,
    body: "We will ping you the moment they drop something new.",
    link: `/artist/${encodeURIComponent(artistName)}`,
  });
  return Response.json({ ok: true, following: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const artistName = new URL(req.url).searchParams.get("artistName") || "";
  await db.delete(followedArtistsTable).where(and(eq(followedArtistsTable.userId, userId), eq(followedArtistsTable.artistName, artistName)));
  return Response.json({ ok: true, following: false });
}
