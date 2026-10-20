import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { endSession, getSessionUser, getSessionUserId, publicUser, ensureSettings } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ user: null });
  const settings = await ensureSettings(user.id);
  return Response.json({ user: publicUser(user), settings });
}

/** Permanent account deletion (cascades to likes, playlists, history…). */
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  await db.delete(users).where(eq(users.id, userId));
  await endSession();
  return Response.json({ ok: true });
}
