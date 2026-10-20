import { db } from "@/db";
import { history, likes, playlists, songs } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Listening stats for the profile page (hours, top artists, genre split, streak). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ stats: null });

  const [seconds] = await db
    .select({ total: sql<number>`coalesce(sum(${history.durationListened}),0)::int` })
    .from(history)
    .where(eq(history.userId, userId));

  const plays = await db
    .select({ songId: history.songId, count: sql<number>`count(*)::int`, playedAt: history.playedAt })
    .from(history)
    .where(eq(history.userId, userId))
    .groupBy(history.songId, history.playedAt)
    .orderBy(desc(history.playedAt))
    .limit(500);

  const likeCount = await db.select({ c: sql<number>`count(*)::int` }).from(likes).where(eq(likes.userId, userId));
  const playlistCount = await db.select({ c: sql<number>`count(*)::int` }).from(playlists).where(eq(playlists.userId, userId));

  // per-song play counts
  const perSong = new Map<string, number>();
  for (const p of plays) perSong.set(p.songId, (perSong.get(p.songId) || 0) + 1);
  const ids = [...perSong.keys()].slice(0, 200);
  const rows = ids.length ? await db.select().from(songs).where(sql`${songs.id} = ANY(${ids})`) : [];

  const artistPlays = new Map<string, number>();
  const genrePlays = new Map<string, number>();
  const topSongs = rows
    .map((r) => ({ id: r.id, title: r.title, artist: r.artist, plays: perSong.get(r.id) || 0, thumbnail: r.thumbnail, duration: r.duration }))
    .sort((a, b) => b.plays - a.plays);

  for (const s of topSongs) {
    artistPlays.set(s.artist, (artistPlays.get(s.artist) || 0) + s.plays);
  }
  for (const r of rows) {
    if (r.genre) genrePlays.set(r.genre, (genrePlays.get(r.genre) || 0) + (perSong.get(r.id) || 0));
  }

  // streak: consecutive days with at least one play
  const days = await db
    .select({ day: sql<string>`to_char(${history.playedAt}, 'YYYY-MM-DD')` })
    .from(history)
    .where(eq(history.userId, userId))
    .groupBy(sql`to_char(${history.playedAt}, 'YYYY-MM-DD')`)
    .orderBy(desc(sql`to_char(${history.playedAt}, 'YYYY-MM-DD')`))
    .limit(400);
  let streak = 0;
  const cursor = new Date();
  for (const d of days) {
    const key = cursor.toISOString().slice(0, 10);
    if (d.day === key) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && d.day === new Date(cursor.setDate(cursor.getDate() - 1)).toISOString().slice(0, 10)) {
      streak += 1;
    } else break;
  }

  const totalSeconds = Number(seconds?.total || 0);
  return Response.json({
    stats: {
      hours: Math.round((totalSeconds / 3600) * 10) / 10,
      minutes: Math.round(totalSeconds / 60),
      plays: plays.length,
      likes: likeCount[0]?.c || 0,
      playlists: playlistCount[0]?.c || 0,
      streak: Math.max(streak, days.length ? 1 : 0),
      topArtists: [...artistPlays.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, plays]) => ({ name, plays })),
      topSongs: topSongs.slice(0, 5),
      genres: [...genrePlays.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, plays]) => ({ name, plays })),
      lastPlayed: await db
        .select({ playedAt: history.playedAt })
        .from(history)
        .where(eq(history.userId, userId))
        .orderBy(desc(history.playedAt))
        .limit(1)
        .then((r) => (r[0] ? r[0].playedAt.toISOString() : null)),
    },
  });
}
