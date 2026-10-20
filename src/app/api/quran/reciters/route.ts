import { getReciters, FEATURED_RECITERS, DEFAULT_RECITER } from "@/lib/sources/quran";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Every audio reciter available (176+), with the 20 featured ones first. */
export async function GET() {
  const reciters = await getReciters();
  return Response.json({
    reciters,
    count: reciters.length,
    featured: FEATURED_RECITERS.map((r) => r.id),
    default: DEFAULT_RECITER,
    source: "alquran.cloud",
  });
}
