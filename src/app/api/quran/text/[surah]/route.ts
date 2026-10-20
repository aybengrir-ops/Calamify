import { NextRequest } from "next/server";
import { getSurahText } from "@/lib/sources/quran";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Arabic text (Uthmani) of one surah, ayah by ayah, with juz/page/sajda. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ surah: string }> }) {
  const { surah } = await ctx.params;
  const number = parseInt(surah, 10);
  if (isNaN(number) || number < 1 || number > 114) {
    return Response.json({ error: "Surah number must be between 1 and 114" }, { status: 400 });
  }
  const { verses, meta } = await getSurahText(number);
  return Response.json({ surah: number, meta, verses, count: verses.length, source: "alquran.cloud" });
}
