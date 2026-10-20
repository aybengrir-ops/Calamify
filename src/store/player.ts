"use client";

import { create } from "zustand";
import { type Song } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";

export type RepeatMode = "off" | "all" | "one";
export type PlayerStatus = "idle" | "loading" | "ready" | "error";

interface PlayerState {
  queue: Song[];
  index: number;
  current: Song | null;
  playing: boolean;
  status: PlayerStatus;
  position: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  /** playback speed – lyrics timing follows the audio clock, so they stay in sync */
  rate: number;
  expanded: boolean;
  queueOpen: boolean;
  lyricsOpen: boolean;
  /** bumped whenever the <audio> element must (re)load its source */
  srcVersion: number;
  /** set when the engine silently switched provider (throttled upstream) */
  fallbackNotice: string | null;
  startedAt: number | null;
  /** percent-based seek requested before the element knew its duration */
  pendingSeekPercent: number | null;
  /** bumped on every user seek so the engine can tell a scrub from a timeupdate echo */
  seekToken: number;

  playContext: (songs: Song[], index?: number) => void;
  playSong: (song: Song, context?: Song[]) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  seekPercent: (percent: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setShuffle: (b: boolean) => void;
  setRate: (r: number) => void;
  cycleRate: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (i: number) => void;
  moveInQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  jumpTo: (i: number) => void;

  // engine hooks
  _setStatus: (s: PlayerStatus) => void;
  _setPlaying: (b: boolean) => void;
  _setPosition: (n: number) => void;
  _setDuration: (n: number) => void;
  _setBuffered: (n: number) => void;
  _setFallback: (msg: string | null) => void;
  _setPendingSeekPercent: (p: number | null) => void;
  _reload: () => void;
  setExpanded: (b: boolean) => void;
  setQueueOpen: (b: boolean) => void;
  setLyricsOpen: (b: boolean) => void;
}

function readVolume(): number {
  if (typeof window === "undefined") return 0.85;
  const raw = window.localStorage.getItem("calamify:volume");
  const v = raw ? parseFloat(raw) : NaN;
  return isNaN(v) ? 0.85 : Math.min(1, Math.max(0, v));
}

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw === null ? fallback : raw === "1";
}

const RATES = [0.75, 1, 1.25, 1.5, 2];

function readRate(): number {
  if (typeof window === "undefined") return 1;
  const v = parseFloat(window.localStorage.getItem("calamify:rate") || "");
  return RATES.includes(v) ? v : 1;
}

function readRepeat(): RepeatMode {
  if (typeof window === "undefined") return "off";
  const raw = window.localStorage.getItem("calamify:repeat");
  return raw === "all" || raw === "one" ? raw : "off";
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: -1,
  current: null,
  playing: false,
  status: "idle",
  position: 0,
  duration: 0,
  buffered: 0,
  volume: readVolume(),
  muted: false,
  shuffle: readBool("calamify:shuffle", false),
  repeat: readRepeat(),
  rate: readRate(),
  expanded: false,
  queueOpen: false,
  lyricsOpen: false,
  srcVersion: 0,
  fallbackNotice: null,
  startedAt: null,
  pendingSeekPercent: null,
  seekToken: 0,

  playContext: (rawSongs, index = 0) => {
    if (!rawSongs.length) return;
    // the same recording must never sit twice in one queue
    const target = rawSongs[index]?.id;
    const songs = dedupeCanonical(rawSongs).kept;
    const i = Math.max(0, target ? Math.max(0, songs.findIndex((s) => s.id === target)) : Math.min(index, songs.length - 1));
    set({
      queue: songs,
      index: i,
      current: songs[i],
      playing: true,
      status: "loading",
      position: 0,
      duration: songs[i]?.duration || 0,
      buffered: 0,
      srcVersion: get().srcVersion + 1,
      fallbackNotice: null,
      startedAt: Date.now(),
    });
  },

  playSong: (song, context) => {
    const songs = context && context.length ? context : [song];
    const idx = songs.findIndex((s) => s.id === song.id);
    get().playContext(songs, idx >= 0 ? idx : 0);
    if (idx < 0) set({ queue: [song, ...songs.filter((s) => s.id !== song.id)], index: 0, current: song });
  },

  toggle: () => {
    const { current, playing } = get();
    if (!current) return;
    set({ playing: !playing });
  },

  next: (auto = false) => {
    const { queue, index, repeat, shuffle } = get();
    if (!queue.length) return;
    if (auto && repeat === "one") {
      set({ position: 0, srcVersion: get().srcVersion + 1, playing: true, status: "loading", fallbackNotice: null });
      return;
    }
    let nextIndex = index + 1;
    if (shuffle && queue.length > 1) {
      while (nextIndex === index) nextIndex = Math.floor(Math.random() * queue.length);
    }
    if (nextIndex >= queue.length) {
      if (repeat === "all" || shuffle) nextIndex = 0;
      else {
        set({ playing: false, position: 0, status: "idle" });
        return;
      }
    }
    set({
      index: nextIndex,
      current: queue[nextIndex],
      playing: true,
      status: "loading",
      position: 0,
      duration: queue[nextIndex]?.duration || 0,
      buffered: 0,
      srcVersion: get().srcVersion + 1,
      fallbackNotice: null,
      startedAt: Date.now(),
    });
  },

  prev: () => {
    const { queue, index, position } = get();
    if (position > 3 || index <= 0) {
      if (position > 3) {
        set({ position: 0 });
        return;
      }
    }
    if (index <= 0) {
      set({ position: 0 });
      return;
    }
    const prevIndex = index - 1;
    set({
      index: prevIndex,
      current: queue[prevIndex],
      playing: true,
      status: "loading",
      position: 0,
      buffered: 0,
      srcVersion: get().srcVersion + 1,
      fallbackNotice: null,
      startedAt: Date.now(),
    });
  },

  seek: (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds) || !isFinite(seconds)) return;
    // Clamp inside the track so scrubbing to the end can't fire `ended`
    const known = get().duration || get().current?.duration || 0;
    const max = known && isFinite(known) ? Math.max(0, known - 0.15) : Number.MAX_SAFE_INTEGER;
    set({
      position: Math.max(0, Math.min(seconds, max)),
      pendingSeekPercent: null,
      seekToken: get().seekToken + 1,
    });
  },

  /**
   * Percent seek – works even when the element has not loaded metadata yet:
   * the percent is stored and applied the moment the duration becomes known.
   */
  seekPercent: (percent) => {
    if (typeof percent !== "number" || isNaN(percent) || !isFinite(percent)) return;
    const p = Math.max(0, Math.min(100, percent));
    const known = get().duration || get().current?.duration || 0;
    if (known > 0 && isFinite(known)) {
      set({ pendingSeekPercent: null });
      get().seek((p / 100) * known);
      return;
    }
    // Optimistic UI: keep the handle where the user dropped it.
    set({ pendingSeekPercent: p, seekToken: get().seekToken + 1 });
  },
  setVolume: (v) => {
    const volume = Math.min(1, Math.max(0, v));
    if (typeof window !== "undefined") window.localStorage.setItem("calamify:volume", String(volume));
    set({ volume, muted: volume === 0 });
  },
  toggleMute: () => set({ muted: !get().muted }),
  setShuffle: (b) => {
    if (typeof window !== "undefined") window.localStorage.setItem("calamify:shuffle", b ? "1" : "0");
    set({ shuffle: b });
  },
  setRate: (r) => {
    const rate = Math.max(0.5, Math.min(3, r));
    if (typeof window !== "undefined") window.localStorage.setItem("calamify:rate", String(rate));
    set({ rate });
  },
  cycleRate: () => {
    const idx = RATES.indexOf(get().rate);
    const next = RATES[(idx + 1) % RATES.length];
    get().setRate(next);
  },
  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const nextMode = order[(order.indexOf(get().repeat) + 1) % order.length];
    if (typeof window !== "undefined") window.localStorage.setItem("calamify:repeat", nextMode);
    set({ repeat: nextMode });
  },
  addToQueue: (song) => {
    const { queue, current } = get();
    const next = queue.length ? [...queue, song] : current ? [current, song] : [song];
    set({ queue: next, index: next.indexOf(current ?? song), current: current ?? song });
  },
  playNextInQueue: (song) => {
    const { queue, index } = get();
    if (!queue.length) {
      get().playContext([song], 0);
      return;
    }
    const next = [...queue];
    next.splice(index + 1, 0, song);
    set({ queue: next });
  },
  removeFromQueue: (i) => {
    const { queue, index } = get();
    if (i === index) return;
    const next = queue.filter((_, idx) => idx !== i);
    set({ queue: next, index: i < index ? index - 1 : index });
  },
  moveInQueue: (from, to) => {
    const { queue, index } = get();
    if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
    const next = [...queue];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    let newIndex = index;
    if (from === index) newIndex = to;
    else if (from < index && to >= index) newIndex = index - 1;
    else if (from > index && to <= index) newIndex = index + 1;
    set({ queue: next, index: newIndex });
  },
  clearQueue: () => {
    const { queue, index } = get();
    const current = get().current;
    set({ queue: current ? [current] : [], index: current ? 0 : -1 });
    void queue;
  },
  jumpTo: (i) => {
    const { queue } = get();
    if (i < 0 || i >= queue.length) return;
    set({
      index: i,
      current: queue[i],
      playing: true,
      status: "loading",
      position: 0,
      buffered: 0,
      srcVersion: get().srcVersion + 1,
      fallbackNotice: null,
      startedAt: Date.now(),
    });
  },

  _setStatus: (s) => set({ status: s }),
  _setPlaying: (b) => set({ playing: b }),
  _setPosition: (n) => set({ position: n }),
  _setDuration: (n) => set({ duration: n }),
  _setBuffered: (n) => set({ buffered: n }),
  _setFallback: (msg) => set({ fallbackNotice: msg }),
  _setPendingSeekPercent: (p) => set({ pendingSeekPercent: p }),
  _reload: () => set({ srcVersion: get().srcVersion + 1, status: "loading" }),
  setExpanded: (b) => set({ expanded: b }),
  setQueueOpen: (b) => set({ queueOpen: b }),
  setLyricsOpen: (b) => set({ lyricsOpen: b }),
}));

/** Build the proxy URL for a song – never a YouTube/Google CDN URL. */
export function audioUrl(song: Song, opts: { version?: number; warm?: boolean } = {}): string {
  const params = new URLSearchParams();
  params.set("title", song.title);
  params.set("artist", song.artist);
  if (opts.warm) params.set("warm", "1");
  if (opts.version) params.set("v", String(opts.version));
  return `/api/audio/${encodeURIComponent(song.id)}?${params.toString()}`;
}
