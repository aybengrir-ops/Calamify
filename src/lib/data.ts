import { and, desc, eq, inArray, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  songs,
  likes,
  playlists,
  playlistSongs,
  history,
  followedArtists as followedArtistsTable,
  savedAlbums as savedAlbumsTable,
  searchHistory,
  notifications,
  downloads,
} from "@/db/schema";
import type { Song } from "./types";

/* ---------------- song metadata cache ---------------- */
export async function cacheSongs(list: Song[]) {
  if (!list.length) return;
  const rows = list.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    duration: s.duration || 0,
    thumbnail: s.thumbnail || "",
    genre: s.genre || null,
    album: s.album || null,
    views: s.views || null,
    channelId: s.channelId || null,
  }));
  await db
    .insert(songs)
    .values(rows)
    .onConflictDoUpdate({
      target: songs.id,
      set: { title: sql`excluded.title`, artist: sql`excluded.artist`, thumbnail: sql`excluded.thumbnail`, duration: sql`excluded.duration` },
    })
    .catch(() => undefined);
}

export async function songsByIds(ids: string[]): Promise<Record<string, Song>> {
  if (!ids.length) return {};
  const rows = await db.select().from(songs).where(inArray(songs.id, ids));
  const out: Record<string, Song> = {};
  for (const r of rows) {
    out[r.id] = {
      id: r.id,
      title: r.title,
      artist: r.artist,
      duration: r.duration,
      thumbnail: r.thumbnail,
      source: r.id.startsWith("au:") ? "audius" : "youtube",
      genre: r.genre || undefined,
      album: r.album || undefined,
      views: r.views || undefined,
      channelId: r.channelId || undefined,
    };
  }
  return out;
}

/* ---------------- likes ---------------- */
export async function likedIds(userId: string): Promise<string[]> {
  const rows = await db.select({ songId: likes.songId }).from(likes).where(eq(likes.userId, userId)).orderBy(desc(likes.createdAt));
  return rows.map((r) => r.songId);
}

export async function likedSongs(userId: string): Promise<Song[]> {
  const rows = await db
    .select({ songId: likes.songId, likedAt: likes.createdAt })
    .from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt));
  const map = await songsByIds(rows.map((r) => r.songId));
  return rows.map((r) => map[r.songId]).filter(Boolean);
}

export async function toggleLike(userId: string, song: Song, liked: boolean) {
  if (liked) {
    await cacheSongs([song]);
    await db.insert(likes).values({ userId, songId: song.id }).onConflictDoNothing();
  } else {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.songId, song.id)));
  }
}

/* ---------------- playlists ---------------- */
export async function userPlaylists(userId: string) {
  const rows = await db
    .select({
      id: playlists.id,
      name: playlists.name,
      description: playlists.description,
      coverUrl: playlists.coverUrl,
      coverSeed: playlists.coverSeed,
      isPublic: playlists.isPublic,
      createdAt: playlists.createdAt,
      count: sql<number>`count(${playlistSongs.id})::int`,
    })
    .from(playlists)
    .leftJoin(playlistSongs, eq(playlistSongs.playlistId, playlists.id))
    .where(eq(playlists.userId, userId))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), songCount: r.count }));
}

export async function playlistWithSongs(userId: string | null, playlistId: string) {
  const [pl] = await db.select().from(playlists).where(eq(playlists.id, playlistId)).limit(1);
  if (!pl) return null;
  const rows = await db
    .select({ songId: playlistSongs.songId, position: playlistSongs.position, addedAt: playlistSongs.addedAt })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId))
    .orderBy(asc(playlistSongs.position));
  const map = await songsByIds(rows.map((r) => r.songId));
  const tracks = rows.map((r) => map[r.songId]).filter(Boolean);
  const owner = pl.userId === userId || pl.isPublic;
  return {
    id: pl.id,
    name: pl.name,
    description: pl.description,
    coverUrl: pl.coverUrl,
    coverSeed: pl.coverSeed,
    isPublic: pl.isPublic,
    createdAt: pl.createdAt.toISOString(),
    owner: pl.userId,
    canEdit: pl.userId === userId,
    tracks,
    totalDuration: tracks.reduce((a, b) => a + (b.duration || 0), 0),
    visible: owner,
  };
}

/* ---------------- history ---------------- */
export async function pushHistory(userId: string, song: Song, listenedSeconds: number) {
  await cacheSongs([song]);
  await db.insert(history).values({ userId, songId: song.id, durationListened: Math.floor(listenedSeconds) });
  // keep the table lean: max 400 rows per user
  await db
    .delete(history)
    .where(
      sql`${history.userId} = ${userId} AND ${history.id} NOT IN (
        SELECT id FROM history WHERE user_id = ${userId} ORDER BY played_at DESC LIMIT 400
      )`
    )
    .catch(() => undefined);
}

export async function recentHistory(userId: string, limit = 100): Promise<{ song: Song; playedAt: string }[]> {
  const rows = await db
    .select({ songId: history.songId, playedAt: history.playedAt })
    .from(history)
    .where(eq(history.userId, userId))
    .orderBy(desc(history.playedAt))
    .limit(limit * 2);
  const map = await songsByIds(rows.map((r) => r.songId));
  const seen = new Set<string>();
  const out: { song: Song; playedAt: string }[] = [];
  for (const r of rows) {
    if (seen.has(r.songId) || !map[r.songId]) continue;
    seen.add(r.songId);
    out.push({ song: map[r.songId], playedAt: r.playedAt.toISOString() });
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------------- artists / albums ---------------- */
export async function followedArtists(userId: string) {
  const rows = await db.select().from(followedArtistsTable).where(eq(followedArtistsTable.userId, userId)).orderBy(desc(followedArtistsTable.followedAt));
  return rows.map((r) => ({ ...r, followedAt: r.followedAt.toISOString() }));
}

export async function savedAlbums(userId: string) {
  const rows = await db.select().from(savedAlbumsTable).where(eq(savedAlbumsTable.userId, userId)).orderBy(desc(savedAlbumsTable.savedAt));
  return rows.map((r) => ({ ...r, savedAt: r.savedAt.toISOString() }));
}

/* ---------------- search history ---------------- */
export async function logSearch(userId: string | null, query: string) {
  if (!userId || !query.trim()) return;
  await db.delete(searchHistory).where(and(eq(searchHistory.userId, userId), eq(searchHistory.query, query))).catch(() => undefined);
  await db.insert(searchHistory).values({ userId, query }).catch(() => undefined);
}

export async function searches(userId: string, limit = 12) {
  const rows = await db
    .select({ query: searchHistory.query, searchedAt: searchHistory.searchedAt })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.searchedAt))
    .limit(limit);
  return rows;
}

/* ---------------- notifications ---------------- */
export async function userNotifications(userId: string, limit = 25) {
  const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function pushNotification(userId: string, n: { type: string; title: string; body?: string; link?: string }) {
  await db.insert(notifications).values({ userId, type: n.type, title: n.title, body: n.body || "", link: n.link || null }).catch(() => undefined);
}

/* ---------------- downloads ---------------- */
export async function userDownloads(userId: string) {
  const rows = await db.select().from(downloads).where(eq(downloads.userId, userId)).orderBy(desc(downloads.createdAt));
  const map = await songsByIds(rows.map((r) => r.songId));
  return rows.map((r) => map[r.songId]).filter(Boolean);
}
