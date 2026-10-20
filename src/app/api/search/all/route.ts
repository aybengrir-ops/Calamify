import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/innertube";
import { searchNCS } from "@/lib/sources/ncs";
import { searchGD, GD_SONGS } from "@/lib/sources/geometrydash";
import { cacheSongs } from "@/lib/data";
import type { Song } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Unified multi-source search: YouTube + NCS + Geometry Dash in one call,
 * returned grouped so the UI can show labelled sections.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return Response.json({ youtube: [], ncs: [], geometrydash: [], total: 0 });

  const [youtube, ncs, geometrydash] = await Promise.all([
    searchYouTube(q, 15).catch(() => [] as Song[]),
    searchNCS(q, 12).catch(() => [] as Song[]),
    searchGD(q, 10).catch(() => [] as Song[]),
  ]);

  const all = [...geometrydash, ...ncs, ...youtube];
  await cacheSongs(all);

  return Response.json({
    youtube,
    ncs,
    geometrydash,
    total: youtube.length + ncs.length + geometrydash.length,
    levels: GD_SONGS.length,
    copyright: { ncs: "FREE — NoCopyrightSounds", geometrydash: "FREE — Creative Commons (Newgrounds)" },
  });
}
