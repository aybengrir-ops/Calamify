import { NextRequest } from "next/server";
import { resolveSection } from "@/lib/sources/catalog";
import { getSection } from "@/lib/catalogData";
import { dedupeEntries } from "@/lib/dedupe";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

/** Resolve a curated section into real, playable full-length tracks. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await ctx.params;
  const section = getSection(decodeURIComponent(sectionId));
  if (!section) return Response.json({ error: "Unknown section" }, { status: 404 });

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") || "40", 10) || 40, 80);
  const tracks = await resolveSection(section.id, limit);
  await cacheSongs(tracks);

  return Response.json({
    section: { id: section.id, title: section.title, subtitle: section.subtitle, icon: section.icon, gradient: section.gradient, copyright: section.copyright, subGroups: section.subGroups || [] },
    duplicatesRemoved: dedupeEntries(section.entries).removed.length,
    tracks,
    resolved: tracks.length,
    requested: Math.min(limit, section.entries.length),
    totalDuration: tracks.reduce((a, b) => a + (b.duration || 0), 0),
  });
}
