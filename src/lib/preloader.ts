"use client";

import { audioUrl } from "@/store/player";
import type { Song } from "./types";

/**
 * Background warmer. Hits the proxy with `warm=1` so the server resolves the
 * upstream stream (and starts caching) BEFORE the user presses play. This is
 * what keeps playback inside the 3–8 second window.
 */
const warmed = new Set<string>();
const inflight = new Set<string>();

export function warmSong(song: Song) {
  const key = `${song.id}`;
  if (warmed.has(key) || inflight.has(key)) return;
  inflight.add(key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  fetch(audioUrl(song, { warm: true }), { signal: controller.signal, method: "GET" })
    .then(() => warmed.add(key))
    .catch(() => undefined)
    .finally(() => {
      clearTimeout(timer);
      inflight.delete(key);
    });
}

export function warmList(songs: Song[], count = 3) {
  songs.slice(0, count).forEach(warmSong);
}

export function forgetWarm(id: string) {
  warmed.delete(id);
}
