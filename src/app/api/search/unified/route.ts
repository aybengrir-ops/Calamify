import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/innertube";
import { searchNewgrounds } from "@/lib/sources/newgrounds";
import { searchNCS } from "@/lib/sources/ncs";
import { searchGDCurated } from "@/lib/sources/geometrydash";
import { searchTracks } from "@/lib/audius";
import { getSurahs, surahToSong, getReciters, findSurahs, DEFAULT_RECITER } from "@/lib/sources/quran";
import { cacheSongs } from "@/lib/data";
import { dedupeSongs, type Song } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ARABIC_RE = /[\u0600-\u06FF]/;

/**
 * Unified search: YouTube + Newgrounds + NCS + Geometry Dash + Audius +
 * القرآن الكريم + أناشيد, returned grouped so the UI can render labelled
 * sections (🎵 Music / 🕌 القرآن / 🎤 أناشيد).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const reciterId = url.searchParams.get("reciter") || DEFAULT_RECITER;
  if (!q) return Response.json({ music: [], quran: [], nasheed: [], total: 0 });

  const [youtube, newgrounds, ncs, geometrydash, audius, surahs, reciters, nasheed] = await Promise.all([
    searchYouTube(q, 12).catch(() => [] as Song[]),
    searchNewgrounds(q, { page: 1 }).catch(() => [] as Song[]),
    searchNCS(q, 8).catch(() => [] as Song[]),
    searchGDCurated(q, 4).catch(() => [] as Song[]),
    searchTracks(q, 8).catch(() => [] as Song[]),
    getSurahs().catch(() => []),
    getReciters().catch(() => []),
    ARABIC_RE.test(q) || /nasheed|نشيد|أناشيد|مديح|دعاء/i.test(q)
      ? searchYouTube(`${q} نشيد`, 6).catch(() => [] as Song[])
      : Promise.resolve([] as Song[]),
  ]);

  const reciter = reciters.find((r) => r.id === reciterId) || reciters.find((r) => r.id === DEFAULT_RECITER) || reciters[0];
  const quran: Song[] = reciter ? findSurahs(surahs, q, 10).map((s) => surahToSong(s, reciter)) : [];

  const music = dedupeCanonical([...geometrydash, ...ncs, ...newgrounds, ...audius, ...youtube]).kept;
  const taggedNasheed = nasheed.map((s) => ({ ...s, genre: "Nasheed", copyright: "FREE — nasheed" }));
  await cacheSongs([...quran, ...taggedNasheed, ...music]);

  return Response.json({
    music,
    quran,
    nasheed: taggedNasheed,
    youtube,
    newgrounds,
    ncs,
    geometrydash,
    audius,
    total: music.length + quran.length + taggedNasheed.length,
    newgroundsReachable: newgrounds.length > 0,
    reciter: reciter ? { id: reciter.id, name: reciter.name, nameEn: reciter.nameEn } : null,
  });
}
