import { NextRequest } from "next/server";
import { db } from "@/db";
import { userSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUserId, ensureSettings, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ settings: null });
  return Response.json({ settings: await ensureSettings(userId) });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  await ensureSettings(userId);
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  const textFields = ["audioQuality", "downloadQuality", "language", "density", "theme", "lastfmUsername"] as const;
  for (const f of textFields) if (typeof body[f] === "string") patch[f] = body[f];
  const boolFields = ["gapless", "normalizeVolume", "reducedMotion", "notifyReleases", "notifyPlaylists", "notifyWeekly", "notifyFriends", "scrobble"] as const;
  for (const f of boolFields) if (typeof body[f] === "boolean") patch[f] = body[f];
  if (typeof body.crossfade === "number") patch.crossfade = Math.max(0, Math.min(12, Math.round(body.crossfade)));
  if (body.equalizer && typeof body.equalizer === "object") patch.equalizer = body.equalizer;

  await db.update(userSettings).set(patch).where(eq(userSettings.userId, userId));

  const userPatch: Record<string, unknown> = {};
  if (typeof body.displayName === "string" && body.displayName.trim()) userPatch.displayName = body.displayName.trim();
  if (typeof body.bio === "string") userPatch.bio = body.bio.slice(0, 280);
  if (typeof body.isPublic === "boolean") userPatch.isPublic = body.isPublic;
  if (typeof body.avatarSeed === "string") userPatch.avatarSeed = body.avatarSeed;
  if (typeof body.avatarUrl === "string") userPatch.avatarUrl = body.avatarUrl;
  if (Array.isArray(body.favoriteGenres)) userPatch.favoriteGenres = body.favoriteGenres.slice(0, 8);
  if (Object.keys(userPatch).length) await db.update(users).set(userPatch).where(eq(users.id, userId));

  if (typeof body.newPassword === "string" && body.newPassword.length >= 6) {
    await db.update(users).set({ passwordHash: await hashPassword(body.newPassword) }).where(eq(users.id, userId));
  }

  return Response.json({ ok: true, settings: await ensureSettings(userId) });
}
