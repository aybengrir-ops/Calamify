import { ALL_SECTIONS } from "@/lib/catalogData";
import { dedupeEntries } from "@/lib/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Curated catalogue sections + static metadata (instant paint, no upstream calls). */
export async function GET() {
  return Response.json({
    sections: ALL_SECTIONS.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      icon: s.icon,
      gradient: s.gradient,
      copyright: s.copyright,
      strictArtist: Boolean(s.strictArtist),
      subGroups: s.subGroups || [],
      // one canonical card per track – no repeats inside a section
      entries: dedupeEntries(s.entries).kept,
    })),
    totalTracks: ALL_SECTIONS.reduce((a, s) => a + s.entries.length, 0),
  });
}
