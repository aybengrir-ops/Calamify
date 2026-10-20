import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "calamify_session";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "calamify-cosmic-dev-secret-please-change";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("calamify")
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function startSession(userId: string) {
  const token = await signToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = typeof users.$inferSelect;

export async function getSessionUserId(): Promise<string | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] || null;
  } catch {
    return null;
  }
}

export function publicUser(user: SessionUser | null) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarSeed: user.avatarSeed,
    bio: user.bio || "",
    isPublic: user.isPublic,
    favoriteGenres: (user.favoriteGenres as string[]) || [],
    provider: user.provider,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function ensureSettings(userId: string) {
  const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  const created = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return created[0];
}

export function usernameFromEmail(email: string): string {
  const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "explorer";
  return `${base.slice(0, 14)}${Math.floor(Math.random() * 900 + 100)}`;
}
