"use client";

/**
 * Shared handle on the single global <audio> element.
 *
 * Components that need frame-accurate timing (the karaoke lyrics) read
 * `currentTime` straight from the element inside a rAF loop instead of relying
 * on the store's ~4 Hz `timeupdate` ticks — that is what keeps word
 * highlighting locked to the track's real speed, including playbackRate.
 */
let el: HTMLAudioElement | null = null;

export function setAudioElement(node: HTMLAudioElement | null) {
  el = node;
}

export function getAudioElement(): HTMLAudioElement | null {
  return el;
}

export function audioTime(): number {
  try {
    return el && isFinite(el.currentTime) ? el.currentTime : 0;
  } catch {
    return 0;
  }
}

export function audioRate(): number {
  try {
    return el?.playbackRate || 1;
  } catch {
    return 1;
  }
}
