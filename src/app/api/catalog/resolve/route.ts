import { NextRequest } from "next/server";
import { resolveCatalogEntry } from "@/lib/sources/catalog";
import { getEntry } from "@/lib/catalogData";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Resolve a single curated entry (used when a card is clicked before its section loaded). */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id") || "";
  const found = getEntry(id);
  if (!found) return Response.json({ error: "Unknown catalogue entry" }, { status: 404 });

  const song = await resolveCatalogEntry(id);
  if (!song) return Response.json({ resolved: false, entry: found.entry, section: found.section.id }, { status: 200 });
  await cacheSongs([song]);
  return Response.json({ resolved: true, song, section: found.section.id });
}
