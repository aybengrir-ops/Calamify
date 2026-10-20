import { NextRequest } from "next/server";
import { searchYouTube, buildRadio } from "@/lib/innertube";
import { searchTracks } from "@/lib/audius";
import { cacheSongs } from "@/lib/data";
import { type Song } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Endless radio seeded from a song, artist or genre. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const title = (url.searchParams.get("title") || "").trim();
  const artist = (url.searchParams.get("artist") || "").trim();
  const genre = (url.searchParams.get("genre") || "").trim();
  const exclude = url.searchParams.get("exclude") || "";

  const seedQueries = [`${artist} ${genre}`.trim(), `${title}`.trim(), `${artist} similar songs`.trim()].filter(Boolean);
  const out: Song[] = [];
  const seen = new Set<string>(exclude.split(",").filter(Boolean));

  for (const q of seedQueries.slice(0, 3)) {
    const [yt, au] = await Promise.all([searchYouTube(q, 14).catch(() => []), searchTracks(q, 8).catch(() => [])]);
    for (const s of [...au, ...yt]) {
      if (!s?.id || seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ ...s, genre: s.genre || genre });
      if (out.length >= 32) break;
    }
    if (out.length >= 32) break;
  }

  const deduped = dedupeCanonical(out).kept;
  out.length = 0;
  out.push(...deduped);

  if (out.length < 8) {
    const fallback = await buildRadio({ id: "", title, artist, duration: 0, thumbnail: "", source: "youtube", genre }).catch(() => []);
    for (const s of fallback) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
      if (out.length >= 32) break;
    }
  }

  await cacheSongs(out);
  return Response.json({ results: out });
}
