import { NextRequest } from "next/server";
import { db } from "@/db";
import { newsletter } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  await db.insert(newsletter).values({ email }).onConflictDoNothing();
  return Response.json({ ok: true, message: "You are in orbit. Cosmic dispatches incoming." });
}
