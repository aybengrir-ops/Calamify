"use client";

import { openDB, type IDBPDatabase } from "idb";

/**
 * Offline music store (IndexedDB via `idb`).
 *
 * Whole tracks are kept as Blobs in `calamify_offline_tracks` together with
 * their metadata and lyrics, so playback works with no network at all.
 * Nothing here runs at build time – it is browser-only and lazy.
 */

export const DB_NAME = "calamify-offline";
export const STORE_NAME = "calamify_offline_tracks";
const VERSION = 1;

export interface OfflineTrack {
  /** Calamify song id (e.g. `au:xyz`, `yt:abc`, `qr:reciter:18`) */
  id: string;
  title: string;
  artist: string;
  artwork: string;
  duration: number;
  genre?: string;
  album?: string;
  source: string;
  /** audio payload */
  blob: Blob;
  mime: string;
  bytes: number;
  lyrics?: string;
  downloadedAt: number;
}

export type OfflineMeta = Omit<OfflineTrack, "blob">;

let dbPromise: Promise<IDBPDatabase | null> | null = null;

function getDb(): Promise<IDBPDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      if (typeof indexedDB === "undefined") return null;
      return await openDB(DB_NAME, VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
            store.createIndex("downloadedAt", "downloadedAt");
          }
        },
      });
    } catch {
      return null;
    }
  })();
  return dbPromise;
}

export async function putTrack(track: OfflineTrack): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put(STORE_NAME, track);
}

export async function getTrack(id: string): Promise<OfflineTrack | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    return ((await db.get(STORE_NAME, id)) as OfflineTrack) || null;
  } catch {
    return null;
  }
}

/** Blob only – used by the audio engine (avoids copying metadata around). */
export async function getTrackBlob(id: string): Promise<Blob | null> {
  const track = await getTrack(id);
  return track?.blob || null;
}

export async function allTracks(): Promise<OfflineTrack[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = (await db.getAll(STORE_NAME)) as OfflineTrack[];
    return rows.sort((a, b) => b.downloadedAt - a.downloadedAt);
  } catch {
    return [];
  }
}

export async function allMetas(): Promise<OfflineMeta[]> {
  const rows = await allTracks();
  return rows.map(({ blob, ...meta }) => meta);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(STORE_NAME, id);
}

export async function clearTracks(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.clear(STORE_NAME);
}

export async function hasTrack(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    return (await db.count(STORE_NAME, id)) > 0;
  } catch {
    return false;
  }
}

export async function totalBytes(): Promise<number> {
  const rows = await allTracks();
  return rows.reduce((sum, t) => sum + (t.bytes || 0), 0);
}

/** Best-available storage estimate (Chrome/Edge expose quota + usage). */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      return { usage: e.usage || 0, quota: e.quota || 0 };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}
