import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, startSession, publicUser, ensureSettings, usernameFromEmail } from "@/lib/auth";
import { pushNotification } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim() || email.split("@")[0] || "Explorer";
    const favoriteGenres: string[] = Array.isArray(body.favoriteGenres) ? body.favoriteGenres.slice(0, 6) : [];

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) return Response.json({ error: "An account already orbits with that email" }, { status: 409 });

    let username = usernameFromEmail(email);
    const clash = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (clash[0]) username = `${username}${Math.floor(Math.random() * 9000 + 1000)}`;

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, username, displayName, passwordHash, favoriteGenres, avatarSeed: username })
      .returning();

    await ensureSettings(user.id);
    await pushNotification(user.id, {
      type: "welcome",
      title: "Welcome to Calamify 🌌",
      body: "Your universe of music is ready. Pick your favorite genres and hit play.",
      link: "/explore",
    });
    await startSession(user.id);
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 500 });
  }
}
