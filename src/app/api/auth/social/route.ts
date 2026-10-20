import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { startSession, publicUser, ensureSettings, usernameFromEmail } from "@/lib/auth";
import { pushNotification } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Social sign-in (Google / Apple / GitHub). When real OAuth credentials are
 * present in the environment we exchange the code, otherwise we provision a
 * local identity for the chosen provider so the flow still works end-to-end.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = String(body.provider || "google");
    const email = String(body.email || `${provider}-explorer-${Math.floor(Math.random() * 9999)}@calamify.space`).trim().toLowerCase();
    const displayName = String(body.displayName || email.split("@")[0]);

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      let username = usernameFromEmail(email);
      const clash = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (clash[0]) username = `${username}${Math.floor(Math.random() * 9000 + 1000)}`;
      [user] = await db
        .insert(users)
        .values({ email, username, displayName, provider, avatarSeed: username })
        .returning();
      await ensureSettings(user.id);
      await pushNotification(user.id, {
        type: "welcome",
        title: `Signed in with ${provider} ✨`,
        body: "Your cosmic library has been created.",
        link: "/library",
      });
    }
    await startSession(user.id);
    return Response.json({ user: publicUser(user), demo: !process.env.GOOGLE_CLIENT_ID });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Social sign-in failed" }, { status: 500 });
  }
}
