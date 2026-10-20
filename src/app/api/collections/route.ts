import { listCollections } from "@/lib/sources/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Phonk/Phunk/Hardcore/Dreamcore + Anime + Nasheed collections (grouped). */
export async function GET() {
  const groups = listCollections();
  return Response.json({ groups, count: groups.reduce((a, g) => a + g.collections.length, 0) });
}
