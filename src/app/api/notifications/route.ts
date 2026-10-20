import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { userNotifications, pushNotification } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ notifications: [], unread: 0 });
  const rows = await userNotifications(userId, 30);
  return Response.json({ notifications: rows, unread: rows.filter((r) => !r.read).length });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, body.id), eq(notifications.userId, userId)));
  } else {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
  return Response.json({ ok: true, unread: 0 });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json();
  await pushNotification(userId, {
    type: String(body.type || "info"),
    title: String(body.title || "Calamify"),
    body: String(body.body || ""),
    link: body.link ? String(body.link) : undefined,
  });
  return Response.json({ ok: true });
}
