import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, startSession, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return Response.json({ error: "Email and password are required" }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return Response.json({ error: "No account found for that email" }, { status: 404 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return Response.json({ error: "Incorrect password" }, { status: 401 });

    await startSession(user.id);
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Login failed" }, { status: 500 });
  }
}
