import { NextRequest } from "next/server";
import { searchNCS } from "@/lib/sources/ncs";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Search the NoCopyrightSounds catalogue (copyright-free, full-length). */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") || "24", 10) || 24, 50);
  if (!q.trim()) return Response.json({ results: [] });
  const results = await searchNCS(q.trim(), limit);
  await cacheSongs(results);
  return Response.json({ results, source: "ncs", copyright: "FREE — NoCopyrightSounds" });
}
