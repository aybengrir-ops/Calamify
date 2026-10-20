"use client";

/**
 * Web Audio analyser singleton. Attaches lazily (on first user gesture) so the
 * AudioContext is always allowed to start, and never breaks playback if it
 * cannot be created.
 */
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let attachedEl: HTMLAudioElement | null = null;
let data: Uint8Array | null = null;

export function attachAnalyser(el: HTMLAudioElement | null) {
  if (!el || attachedEl === el) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    ctx = ctx || new AudioCtx();
    const source = ctx.createMediaElementSource(el);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    data = new Uint8Array(analyser.frequencyBinCount);
    attachedEl = el;
  } catch {
    analyser = null;
  }
}

export async function resumeAudioContext() {
  if (ctx && ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

export function getFrequencyData(): Uint8Array | null {
  if (!analyser || !data) return null;
  try {
    analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
    return data;
  } catch {
    return null;
  }
}
