"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { Song } from "@/lib/types";
import { useUi } from "./ui";

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarSeed: string | null;
  bio: string;
  isPublic: boolean;
  favoriteGenres: string[];
  provider: string;
  createdAt: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverSeed: string | null;
  isPublic: boolean;
  songCount: number;
  createdAt: string;
}

export interface FollowedArtist {
  artistName: string;
  thumbnail: string | null;
  listeners: string | null;
}

export interface SavedAlbum {
  albumKey: string;
  name: string;
  artist: string;
  coverUrl: string | null;
  query: string;
  year?: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const LS_LIKES = "calamify:guest-likes";

function readGuestLikes(): Song[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LS_LIKES) || "[]");
    return Array.isArray(parsed) ? (parsed as Song[]) : [];
  } catch {
    return [];
  }
}

function writeGuestLikes(list: Song[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_LIKES, JSON.stringify(list.slice(0, 500)));
}

function idsOf(list: Song[]) {
  return list.map((s) => s.id);
}

const GUEST_LIKES_KEY = "calamify:guest-likes";
const LOCAL_HISTORY_KEY = "calamify:local-history";

/**
 * Merge everything the guest accumulated on this device into the cloud account
 * the moment they sign in (likes first, then listening history).
 */
async function syncGuestState(): Promise<{ likes: number; history: number }> {
  let likes = 0;
  let history = 0;
  try {
    const rawLikes = window.localStorage.getItem(GUEST_LIKES_KEY);
    const guestLikes: Song[] = rawLikes ? JSON.parse(rawLikes) : [];
    if (guestLikes.length) {
      await api("/api/user/likes", { method: "POST", body: JSON.stringify({ songs: guestLikes }) });
      likes = guestLikes.length;
    }
  } catch {
    /* continue - history matters too */
  }
  try {
    const rawHist = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    const guestHistory: { song: Song; playedAt: string }[] = rawHist ? JSON.parse(rawHist) : [];
    const items = guestHistory
      .filter((h) => h?.song?.id)
      .map((h) => ({ song: h.song, seconds: Math.max(11, h.song.duration || 30) }))
      .slice(0, 60);
    if (items.length) {
      await api("/api/user/history", { method: "POST", body: JSON.stringify({ items }) });
      history = items.length;
    }
  } catch {
    /* ignore */
  }
  if (likes || history) {
    try {
      window.localStorage.removeItem(GUEST_LIKES_KEY);
      window.localStorage.removeItem(LOCAL_HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }
  return { likes, history };
}

interface SessionState {
  user: PublicUser | null;
  settings: any | null;
  hydrated: boolean;
  likes: string[];
  likedSongs: Song[];
  playlists: PlaylistSummary[];
  history: { song: Song; playedAt: string }[];
  artists: FollowedArtist[];
  albums: SavedAlbum[];
  searches: string[];
  notifications: AppNotification[];
  downloads: Song[];

  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, favoriteGenres?: string[]) => Promise<void>;
  social: (provider: string) => Promise<void>;
  logout: () => Promise<void>;

  isLiked: (id: string) => boolean;
  toggleLike: (song: Song) => Promise<void>;
  logPlay: (song: Song, seconds: number) => Promise<void>;
  clearHistory: () => Promise<void>;

  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<string | null>;
  updatePlaylist: (id: string, patch: Record<string, unknown>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongsToPlaylist: (id: string, songs: Song[]) => Promise<void>;
  removeSongFromPlaylist: (id: string, songId: string) => Promise<void>;
  reorderPlaylist: (id: string, order: string[]) => Promise<void>;

  followArtist: (name: string, thumbnail?: string, listeners?: string) => Promise<void>;
  unfollowArtist: (name: string) => Promise<void>;
  isFollowing: (name: string) => boolean;

  saveAlbum: (album: SavedAlbum) => Promise<void>;
  unsaveAlbum: (albumKey: string) => Promise<void>;
  isAlbumSaved: (key: string) => boolean;

  recordSearch: (query: string) => void;
  markNotificationsRead: () => Promise<void>;
  updateSettings: (patch: Record<string, unknown>) => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  settings: null,
  hydrated: false,
  likes: idsOf(readGuestLikes()),
  likedSongs: readGuestLikes(),
  playlists: [],
  history: [],
  artists: [],
  albums: [],
  searches: [],
  notifications: [],
  downloads: [],

  refresh: async () => {
    try {
      const data = await api("/api/library");
      set({
        user: data.user || null,
        likedSongs: data.likes || [],
        likes: (data.likes || []).map((s: Song) => s.id),
        playlists: data.playlists || [],
        history: data.history || [],
        artists: data.artists || [],
        albums: data.albums || [],
        searches: data.searches || [],
        notifications: data.notifications || [],
        downloads: data.downloads || [],
        hydrated: true,
      });
      const me = await api("/api/auth/me").catch(() => null);
      if (me?.settings) set({ settings: me.settings });
    } catch {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    const data = await api<{ user: PublicUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    set({ user: data.user });
    await get().refresh();
    const merged = await syncGuestState();
    await get().refresh();
    useUi.getState().toast(
      merged.likes || merged.history
        ? `Welcome back, ${data.user.displayName} - synced ${merged.likes} liked song(s) and ${merged.history} play(s) from this device`
        : `Welcome back, ${data.user.displayName}`,
      "success"
    );
  },

  signup: async (email, password, displayName, favoriteGenres) => {
    const data = await api<{ user: PublicUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName, favoriteGenres }),
    });
    set({ user: data.user });
    await get().refresh();
    const merged = await syncGuestState();
    await get().refresh();
    useUi.getState().toast(
      merged.likes || merged.history
        ? `Welcome aboard, ${data.user.displayName} - ${merged.likes} liked song(s) and ${merged.history} play(s) synced to your account`
        : `Account created - welcome aboard, ${data.user.displayName}`,
      "success"
    );
  },

  social: async (provider) => {
    const data = await api<{ user: PublicUser; demo?: boolean }>("/api/auth/social", { method: "POST", body: JSON.stringify({ provider }) });
    set({ user: data.user });
    await get().refresh();
    const merged = await syncGuestState();
    await get().refresh();
    useUi.getState().toast(
      merged.likes || merged.history
        ? `Signed in with ${provider} - merged ${merged.likes} like(s) and ${merged.history} play(s) from this device`
        : data.demo
          ? `Signed in with ${provider} (sandbox identity)`
          : `Signed in with ${provider}`,
      "success"
    );
  },

  logout: async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    set({ user: null, likedSongs: readGuestLikes(), likes: idsOf(readGuestLikes()), playlists: [], history: [], artists: [], albums: [], notifications: [] });
    useUi.getState().toast("Signed out. Your guest library stays on this device.", "info");
  },

  isLiked: (id) => get().likes.includes(id),

  toggleLike: async (song) => {
    const liked = !get().isLiked(song.id);
    // optimistic UI first
    const nextSongs = liked ? [song, ...get().likedSongs.filter((s) => s.id !== song.id)] : get().likedSongs.filter((s) => s.id !== song.id);
    set({ likedSongs: nextSongs, likes: idsOf(nextSongs) });
    if (!get().user) {
      writeGuestLikes(nextSongs);
      useUi.getState().toast(liked ? `Saved "${song.title}" on this device` : `Removed "${song.title}"`, "info", {
        label: "Sign in to sync",
        onClick: () => useUi.getState().setAuthOpen(true, "signup"),
      });
      return;
    }
    try {
      await api("/api/library/like", { method: "POST", body: JSON.stringify({ song, liked }) });
      useUi.getState().toast(liked ? `♥ Added to Liked Songs` : `Removed from Liked Songs`, liked ? "success" : "info");
    } catch (e) {
      const reverted = liked ? nextSongs.filter((s) => s.id !== song.id) : [song, ...nextSongs];
      set({ likedSongs: reverted, likes: idsOf(reverted) });
      useUi.getState().toast(e instanceof Error ? e.message : "Could not update likes", "error");
    }
  },

  logPlay: async (song, seconds) => {
    if (!get().user) return;
    try {
      await api("/api/library/history", { method: "POST", body: JSON.stringify({ song, seconds }) });
      set({ history: [{ song, playedAt: new Date().toISOString() }, ...get().history.filter((h) => h.song.id !== song.id)].slice(0, 100) });
    } catch {
      /* history is best-effort */
    }
  },

  clearHistory: async () => {
    if (!get().user) {
      set({ history: [] });
      return;
    }
    await api("/api/library/history", { method: "DELETE" }).catch(() => undefined);
    set({ history: [] });
    useUi.getState().toast("Recently played cleared", "info");
  },

  createPlaylist: async (name, description = "", isPublic = true) => {
    if (!get().user) {
      useUi.getState().setAuthOpen(true, "signup");
      useUi.getState().toast("Sign in to create playlists", "error");
      return null;
    }
    try {
      const data = await api<{ playlist: { id: string } }>("/api/playlists", {
        method: "POST",
        body: JSON.stringify({ name, description, isPublic }),
      });
      await get().refresh();
      useUi.getState().toast(`Playlist "${name}" created`, "success");
      return data.playlist.id;
    } catch (e) {
      useUi.getState().toast(e instanceof Error ? e.message : "Could not create playlist", "error");
      return null;
    }
  },

  updatePlaylist: async (id, patch) => {
    await api(`/api/playlists/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).catch(() => undefined);
    await get().refresh();
  },

  deletePlaylist: async (id) => {
    await api(`/api/playlists/${id}`, { method: "DELETE" }).catch(() => undefined);
    await get().refresh();
    useUi.getState().toast("Playlist deleted", "info");
  },

  addSongsToPlaylist: async (id, songs) => {
    if (!get().user) {
      useUi.getState().setAuthOpen(true, "signup");
      return;
    }
    try {
      await api(`/api/playlists/${id}/songs`, { method: "POST", body: JSON.stringify({ songs }) });
      await get().refresh();
      useUi.getState().toast(`Added ${songs.length} track${songs.length > 1 ? "s" : ""} to playlist`, "success");
    } catch (e) {
      useUi.getState().toast(e instanceof Error ? e.message : "Could not add tracks", "error");
    }
  },

  removeSongFromPlaylist: async (id, songId) => {
    await api(`/api/playlists/${id}/songs?songId=${encodeURIComponent(songId)}`, { method: "DELETE" }).catch(() => undefined);
    useUi.getState().toast("Removed from playlist", "info");
  },

  reorderPlaylist: async (id, order) => {
    await api(`/api/playlists/${id}/songs`, { method: "PATCH", body: JSON.stringify({ order }) }).catch(() => undefined);
  },

  followArtist: async (name, thumbnail = "", listeners = "0") => {
    if (!get().user) {
      useUi.getState().setAuthOpen(true, "signup");
      useUi.getState().toast("Sign in to follow artists", "error");
      return;
    }
    set({ artists: [{ artistName: name, thumbnail, listeners }, ...get().artists] });
    await api("/api/library/artist", { method: "POST", body: JSON.stringify({ artistName: name, thumbnail, listeners }) }).catch(() => undefined);
    useUi.getState().toast(`Following ${name}`, "success");
  },

  unfollowArtist: async (name) => {
    set({ artists: get().artists.filter((a) => a.artistName !== name) });
    await api(`/api/library/artist?artistName=${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => undefined);
    useUi.getState().toast(`Unfollowed ${name}`, "info");
  },

  isFollowing: (name) => get().artists.some((a) => a.artistName.toLowerCase() === name.toLowerCase()),

  saveAlbum: async (album) => {
    if (!get().user) {
      useUi.getState().setAuthOpen(true, "signup");
      return;
    }
    set({ albums: [album, ...get().albums] });
    await api("/api/library/album", { method: "POST", body: JSON.stringify(album) }).catch(() => undefined);
    useUi.getState().toast(`Saved "${album.name}" to your library`, "success");
  },

  unsaveAlbum: async (albumKey) => {
    set({ albums: get().albums.filter((a) => a.albumKey !== albumKey) });
    await api(`/api/library/album?albumKey=${encodeURIComponent(albumKey)}`, { method: "DELETE" }).catch(() => undefined);
    useUi.getState().toast("Removed from saved albums", "info");
  },

  isAlbumSaved: (key) => get().albums.some((a) => a.albumKey === key),

  recordSearch: (query) => {
    const q = query.trim();
    if (!q) return;
    const next = [q, ...get().searches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 12);
    set({ searches: next });
    if (typeof window !== "undefined") window.localStorage.setItem("calamify:searches", JSON.stringify(next));
  },

  markNotificationsRead: async () => {
    set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) });
    await api("/api/notifications", { method: "PATCH", body: JSON.stringify({}) }).catch(() => undefined);
  },

  updateSettings: async (patch) => {
    const data = await api("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }).catch(() => null);
    if (data?.settings) set({ settings: data.settings });
    else if (!get().user) set({ settings: { ...(get().settings || {}), ...patch } });
  },
}));
