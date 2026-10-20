"use client";

/**
 * Calamify sound engine — every UI sound is synthesized with the Web Audio API.
 * Zero audio files, zero network requests, instant playback.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let muted = false;
let masterVolume = 0.3;
let ambientNodes: { osc1: OscillatorNode; osc2: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
let lastHover = 0;
let lastTick = 0;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundMuted(value: boolean) {
  muted = value;
  if (value) stopAmbient();
}
export function isSoundMuted() {
  return muted;
}
export function setSoundVolume(vol: number) {
  masterVolume = Math.max(0, Math.min(1, vol));
  if (ambientNodes) ambientNodes.gain.gain.value = masterVolume * 0.03;
}
export function getSoundVolume() {
  return masterVolume;
}

function env(gain: GainNode, peak: number, attack: number, decay: number, startAt = 0) {
  const c = ctx as Ctx;
  const t = c.currentTime + startAt;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/* 1 · hover — soft sparkle (throttled so fast mouse movement stays pleasant) */
export function playHover() {
  if (muted) return;
  const now = performance.now();
  if (now - lastHover < 55) return;
  lastHover = now;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2800, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(4200, c.currentTime + 0.06);
    filter.type = "lowpass";
    filter.frequency.value = 5000;
    env(gain, masterVolume * 0.05, 0.005, 0.075);
    osc.connect(filter).connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}

/* 2 · click — crisp tap */
export function playClick() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.05);
    env(gain, masterVolume * 0.14, 0.004, 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.07);
  } catch {
    /* ignore */
  }
}

/* 3 · bass drop — deep boom when a track starts */
export function playBassDrop() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const sub = c.createOscillator();
    const subGain = c.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(150, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    env(subGain, masterVolume * 0.34, 0.008, 0.48);
    sub.connect(subGain).connect(c.destination);
    sub.start(t);
    sub.stop(t + 0.55);

    const impact = c.createOscillator();
    const impactGain = c.createGain();
    impact.type = "square";
    impact.frequency.setValueAtTime(800, t);
    impact.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    env(impactGain, masterVolume * 0.1, 0.003, 0.09);
    impact.connect(impactGain).connect(c.destination);
    impact.start(t);
    impact.stop(t + 0.12);

    const size = Math.floor(c.sampleRate * 0.05);
    const buffer = c.createBuffer(1, size, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = c.createBufferSource();
    const noiseGain = c.createGain();
    noise.buffer = buffer;
    env(noiseGain, masterVolume * 0.07, 0.002, 0.05);
    noise.connect(noiseGain).connect(c.destination);
    noise.start(t);
  } catch {
    /* ignore */
  }
}

/* 4 · pause — reverse sweep */
export function playPauseSound() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.1);
    env(gain, masterVolume * 0.09, 0.006, 0.11);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.13);
  } catch {
    /* ignore */
  }
}

/* 5 · swoosh — section/page transitions */
export function playSwoosh() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const size = Math.floor(c.sampleRate * 0.2);
    const buffer = c.createBuffer(1, size, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(masterVolume * 0.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    noise.connect(filter).connect(gain).connect(c.destination);
    noise.start(t);
    noise.stop(t + 0.22);
  } catch {
    /* ignore */
  }
}

/* 6 · notification ping */
export function playNotification() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    [
      { freq: 880, at: 0, decay: 0.15 },
      { freq: 1320, at: 0.1, decay: 0.2 },
    ].forEach(({ freq, at, decay }) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      env(gain, masterVolume * 0.11, 0.008, decay, at);
      osc.connect(gain).connect(c.destination);
      osc.start(t + at);
      osc.stop(t + at + decay + 0.05);
    });
  } catch {
    /* ignore */
  }
}

/* 7 · like — warm C major chord */
export function playLike() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      env(gain, masterVolume * 0.055, 0.02, 0.26, i * 0.03);
      osc.connect(gain).connect(c.destination);
      osc.start(t + i * 0.03);
      osc.stop(t + i * 0.03 + 0.32);
    });
  } catch {
    /* ignore */
  }
}

/* 8 · error glitch */
export function playError() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.setValueAtTime(150, t + 0.05);
    osc.frequency.setValueAtTime(100, t + 0.1);
    env(gain, masterVolume * 0.09, 0.004, 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  } catch {
    /* ignore */
  }
}

/* 9 · seek tick (throttled – scrubbing fires many) */
export function playSeekTick() {
  if (muted) return;
  const now = performance.now();
  if (now - lastTick < 40) return;
  lastTick = now;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 3000 + Math.random() * 1000;
    env(gain, masterVolume * 0.028, 0.002, 0.02);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.03);
  } catch {
    /* ignore */
  }
}

/* 10 · ambient space drone (looping, off by default) */
export function startAmbient() {
  if (muted || ambientNodes) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    osc1.type = "sine";
    osc1.frequency.value = 55;
    osc2.type = "sine";
    osc2.frequency.value = 82.5;
    lfo.type = "sine";
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 5;
    filter.type = "lowpass";
    filter.frequency.value = 200;
    gain.gain.value = masterVolume * 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(c.destination);
    osc1.start();
    osc2.start();
    lfo.start();
    ambientNodes = { osc1, osc2, lfo, gain };
  } catch {
    /* ignore */
  }
}

export function stopAmbient() {
  if (!ambientNodes) return;
  try {
    ambientNodes.osc1.stop();
    ambientNodes.osc2.stop();
    ambientNodes.lfo.stop();
    ambientNodes.gain.disconnect();
  } catch {
    /* ignore */
  }
  ambientNodes = null;
}

export function isAmbientRunning() {
  return Boolean(ambientNodes);
}

/* 13 · recognition scanning blip (repeats while matching) */
export function playScanBlip(step = 0) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    const base = 900 + (step % 8) * 110;
    osc.frequency.setValueAtTime(base, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, c.currentTime + 0.05);
    env(gain, masterVolume * 0.05, 0.004, 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
  } catch {
    /* ignore */
  }
}

/* 14 · recognition start sweep */
export function playScanStart() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, c.currentTime + 0.45);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    env(gain, masterVolume * 0.07, 0.02, 0.45);
    osc.connect(filter).connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.5);
  } catch {
    /* ignore */
  }
}

/* 15 · match found — rising shimmer chord */
export function playMatchChime() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    [523.25, 783.99, 1046.5, 1567.98].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = i % 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      env(gain, masterVolume * 0.07, 0.015, 0.5, i * 0.07);
      osc.connect(gain).connect(c.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.62);
    });
  } catch {
    /* ignore */
  }
}

/* 16 · no match — descending muted thud */
export function playNoMatch() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.35);
    env(gain, masterVolume * 0.09, 0.01, 0.35);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  } catch {
    /* ignore */
  }
}

/* 11 · next track — ascending arpeggio */
export function playNext() {
  arpeggio([440, 554.37, 659.25, 880]);
}

/* 12 · previous track — descending arpeggio */
export function playPrev() {
  arpeggio([880, 659.25, 554.37, 440]);
}

function arpeggio(freqs: number[]) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    freqs.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      env(gain, masterVolume * 0.055, 0.012, 0.09, i * 0.04);
      osc.connect(gain).connect(c.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.14);
    });
  } catch {
    /* ignore */
  }
}
