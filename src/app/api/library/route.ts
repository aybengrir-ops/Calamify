import { getSessionUserId, publicUser, getSessionUser } from "@/lib/auth";
import {
  likedSongs,
  userPlaylists,
  recentHistory,
  followedArtists,
  savedAlbums,
  searches,
  userNotifications,
  userDownloads,
} from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One round-trip that hydrates the whole client-side library. */
export async function GET() {
  const userId = await getSessionUserId();
  const user = await getSessionUser();
  if (!userId) return Response.json({ user: null, likes: [], playlists: [], history: [], artists: [], albums: [], searches: [], notifications: [], downloads: [] });

  const [likes, playlists, hist, artists, albums, srch, notifs, downloads] = await Promise.all([
    likedSongs(userId).catch(() => []),
    userPlaylists(userId).catch(() => []),
    recentHistory(userId, 60).catch(() => []),
    followedArtists(userId).catch(() => []),
    savedAlbums(userId).catch(() => []),
    searches(userId, 10).catch(() => []),
    userNotifications(userId, 20).catch(() => []),
    userDownloads(userId).catch(() => []),
  ]);

  return Response.json({
    user: publicUser(user),
    likes,
    playlists,
    history: hist,
    artists,
    albums,
    searches: srch.map((s) => s.query),
    notifications: notifs,
    downloads,
  });
}
