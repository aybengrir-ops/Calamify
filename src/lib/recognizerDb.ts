"use client";

/**
 * IndexedDB cache for recognition fingerprints.
 *
 * Fingerprints are built lazily in the browser (never at build/deploy time)
 * and reused across sessions, so the second recognition run is instant.
 * Falls back to an in-memory map when IndexedDB is unavailable.
 */

export interface StoredFingerprint {
  id: string;
  hashes: ArrayBuffer;
  times: ArrayBuffer;
  env: ArrayBuffer;
  frames: number;
  sampleRate: number;
  hop: number;
  meta: { title: string; artist: string; thumbnail: string; duration: number };
  builtAt: number;
}

const DB_NAME = "calamify-recognition";
const STORE = "fingerprints";
const META = "meta";
const memory = new Map<string, StoredFingerprint>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function getFingerprint(id: string): Promise<StoredFingerprint | null> {
  const mem = memory.get(id);
  if (mem) return mem;
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => {
        const value = req.result as StoredFingerprint | undefined;
        if (value) memory.set(id, value);
        resolve(value || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putFingerprint(fp: StoredFingerprint): Promise<void> {
  memory.set(fp.id, fp);
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(fp);
  } catch {
    /* memory only */
  }
}

export async function allFingerprintIds(): Promise<string[]> {
  const db = await openDb();
  if (!db) return [...memory.keys()];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => resolve([...memory.keys()]);
    } catch {
      resolve([...memory.keys()]);
    }
  });
}

export async function clearFingerprints(): Promise<void> {
  memory.clear();
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
  } catch {
    /* ignore */
  }
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(META, "readwrite");
    tx.objectStore(META).put({ key, value, at: Date.now() });
  } catch {
    /* ignore */
  }
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(META, "readonly");
      const req = tx.objectStore(META).get(key);
      req.onsuccess = () => resolve((req.result?.value as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
