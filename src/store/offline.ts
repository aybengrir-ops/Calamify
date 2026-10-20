"use client";

import { create } from "zustand";
import { allMetas, clearTracks, deleteTrack, formatBytes, getTrackBlob, putTrack, storageEstimate, totalBytes, type OfflineMeta } from "@/lib/offlineDb";
import { audioUrl } from "@/store/player";
import { useUi } from "@/store/ui";
import type { Song } from "@/lib/types";

/**
 * Offline download engine.
 *
 * Downloads stream through our own `/api/audio` proxy (never a CDN URL),
 * report live percentage progress, and land in IndexedDB as Blobs so they play
 * with zero network. Object URLs are cached and revoked on eviction.
 */

interface OfflineState {
  tracks: OfflineMeta[];
  progress: Record<string, number>;
  downloading: Record<string, boolean>;
  online: boolean;
  ready: boolean;
  bytes: number;
  quota: number;
  usage: number;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  download: (song: Song, opts?: { lyrics?: string; silent?: boolean }) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isDownloaded: (id: string) => boolean;
  isDownloading: (id: string) => boolean;
  percentOf: (id: string) => number;
  blobUrlFor: (id: string) => Promise<string | null>;
  setOnline: (v: boolean) => void;
}

const objectUrls = new Map<string, string>();
let initialised = false;

export const useOffline = create<OfflineState>((set, get) => ({
  tracks: [],
  progress: {},
  downloading: {},
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  ready: false,
  bytes: 0,
  quota: 0,
  usage: 0,

  init: async () => {
    if (initialised) return;
    initialised = true;
    if (typeof window === "undefined") return;
    const on = () => {
      set({ online: true });
      useUi.getState().toast("Back online — streaming the full catalogue again", "success");
    };
    const off = () => {
      set({ online: false });
      useUi.getState().toast("Offline Mode Active — playing from local storage", "info");
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    await get().refresh();
  },

  refresh: async () => {
    const [tracks, bytes, est] = await Promise.all([allMetas(), totalBytes(), storageEstimate()]);
    set({ tracks, bytes, ready: true, usage: est?.usage || 0, quota: est?.quota || 0 });
  },

  download: async (song, opts) => {
    const { toast } = useUi.getState();
    if (get().isDownloaded(song.id)) {
      if (!opts?.silent) toast(`“${song.title}” is already downloaded`, "info");
      return true;
    }
    if (!navigator.onLine) {
      toast("You are offline — connect once to download this track", "error");
      return false;
    }
    set((s) => ({ downloading: { ...s.downloading, [song.id]: true }, progress: { ...s.progress, [song.id]: 0 } }));
    if (!opts?.silent) toast(`Downloading “${song.title}”…`, "info");

    try {
      const res = await fetch(audioUrl(song), { headers: { Range: "bytes=0-" } });
      if (!res.ok && res.status !== 206) throw new Error(`stream ${res.status}`);
      const expected = Number(res.headers.get("content-length") || (song.duration ? song.duration * 16000 : 0));
      const mime = res.headers.get("content-type") || "audio/mpeg";
      const chunks: Uint8Array[] = [];
      let received = 0;

      if (res.body) {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            if (expected) {
              const pct = Math.min(99, Math.round((received / expected) * 100));
              set((s) => ({ progress: { ...s.progress, [song.id]: pct } }));
            }
          }
        }
      } else {
        const buf = new Uint8Array(await res.arrayBuffer());
        chunks.push(buf);
        received = buf.byteLength;
      }

      if (received < 16_000) throw new Error("stream too small");

      const blob = new Blob(chunks as BlobPart[], { type: mime });
      await putTrack({
        id: song.id,
        title: song.title,
        artist: song.artist,
        artwork: song.thumbnail,
        duration: song.duration,
        genre: song.genre,
        album: song.album,
        source: song.source,
        blob,
        mime,
        bytes: blob.size,
        lyrics: opts?.lyrics || "",
        downloadedAt: Date.now(),
      });
      objectUrls.delete(song.id);
      set((s) => ({ progress: { ...s.progress, [song.id]: 100 }, downloading: { ...s.downloading, [song.id]: false } }));
      await get().refresh();
      // keep the server-side registry in sync for signed-in users
      void fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song }),
      }).catch(() => undefined);
      if (!opts?.silent) toast(`Saved “${song.title}” for offline (${formatBytes(blob.size)})`, "success");
      return true;
    } catch (error) {
      set((s) => ({ downloading: { ...s.downloading, [song.id]: false }, progress: { ...s.progress, [song.id]: 0 } }));
      if (!opts?.silent) toast(error instanceof Error ? `Download failed: ${error.message}` : "Download failed", "error");
      return false;
    }
  },

  remove: async (id) => {
    const url = objectUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(id);
    }
    await deleteTrack(id);
    await get().refresh();
    void fetch(`/api/downloads?songId=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
    useUi.getState().toast("Removed from downloads", "info");
  },

  clearAll: async () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
    await clearTracks();
    await get().refresh();
    void fetch("/api/downloads", { method: "DELETE" }).catch(() => undefined);
    useUi.getState().toast("All downloads cleared", "info");
  },

  isDownloaded: (id) => get().tracks.some((t) => t.id === id),
  isDownloading: (id) => Boolean(get().downloading[id]),
  percentOf: (id) => get().progress[id] || 0,

  blobUrlFor: async (id) => {
    const cached = objectUrls.get(id);
    if (cached) return cached;
    const blob = await getTrackBlob(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);
    // simple LRU: keep at most 6 object URLs alive
    if (objectUrls.size > 6) {
      const oldest = objectUrls.keys().next().value as string | undefined;
      if (oldest && oldest !== id) {
        URL.revokeObjectURL(objectUrls.get(oldest) as string);
        objectUrls.delete(oldest);
      }
    }
    return url;
  },

  setOnline: (v) => set({ online: v }),
}));
