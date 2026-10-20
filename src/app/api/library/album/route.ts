import { NextRequest } from "next/server";
import { db } from "@/db";
import { savedAlbums as savedAlbumsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to save albums" }, { status: 401 });
  const body = await req.json();
  const albumKey = String(body.albumKey || "").trim();
  if (!albumKey) return Response.json({ error: "albumKey is required" }, { status: 400 });
  await db
    .insert(savedAlbumsTable)
    .values({
      userId,
      albumKey,
      name: String(body.name || albumKey),
      artist: String(body.artist || "Unknown Artist"),
      year: body.year ? String(body.year) : null,
      coverUrl: body.coverUrl || null,
      query: String(body.query || `${body.name || albumKey} ${body.artist || ""}`.trim()),
    })
    .onConflictDoNothing();
  return Response.json({ ok: true, saved: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const albumKey = new URL(req.url).searchParams.get("albumKey") || "";
  await db.delete(savedAlbumsTable).where(and(eq(savedAlbumsTable.userId, userId), eq(savedAlbumsTable.albumKey, albumKey)));
  return Response.json({ ok: true, saved: false });
}
