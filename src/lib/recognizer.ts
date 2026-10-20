"use client";

/**
 * Calamify music recognition — client-side only.
 *
 * Nothing heavy happens at build/deploy time. The corpus comes from the
 * curated catalogue API, fingerprints are computed in a Web Worker (so the UI
 * never freezes) and cached in IndexedDB for instant repeat runs.
 *
 * Pipeline per track: proxy audio (Range-limited) → decode → mono downmix →
 * worker: resample 8 kHz → noise gate + silence trim → STFT → constellation
 * fingerprint → coarse inverted-index vote → fine envelope cross-correlation
 * → confidence + offset in the track.
 */

import type { Song } from "./types";
import { getFingerprint, putFingerprint, type StoredFingerprint } from "./recognizerDb";

export type Phase = "idle" | "listening" | "processing" | "matching" | "matched" | "nomatch" | "cancelled" | "error";

export interface MatchResult {
  song: Song;
  score: number;
  offsetSeconds: number;
  hashRatio: number;
  envScore: number;
}

export interface Timings {
  corpusMs: number;
  fingerprintMs: number;
  matchMs: number;
  totalMs: number;
}

export interface CorpusResponse {
  scope: string;
  section: string | null;
  songs: Song[];
  count: number;
  duplicatesRemoved: number;
  sections: { id: string; title: string; icon: string; entries: number }[];
  timings: { corpusMs: number };
}

export const SOLID_CONFIDENCE = 0.3;
export const AMBIGUOUS_CONFIDENCE = 0.12;

let worker: Worker | null = null;
let audioCtx: AudioContext | null = null;
let pending = new Map<number, (value: any) => void>();
let msgId = 0;

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker("/recognizer.worker.js");
  worker.onmessage = (e: MessageEvent) => {
    const id = e.data?.reqId;
    const resolve = id !== undefined ? pending.get(id) : null;
    if (resolve) {
      pending.delete(id);
      resolve(e.data);
    }
  };
  worker.onerror = () => {
    pending.forEach((resolve) => resolve({ type: "error" }));
    pending.clear();
  };
  return worker;
}

function post(type: string, payload: Record<string, unknown>, transfer: Transferable[] = []): Promise<any> {
  const w = getWorker();
  const reqId = ++msgId;
  return new Promise((resolve) => {
    pending.set(reqId, resolve);
    try {
      w.postMessage({ type, reqId, ...payload }, transfer);
    } catch {
      pending.delete(reqId);
      resolve({ type: "error" });
    }
  });
}

export function cancelWorker() {
  try {
    worker?.postMessage({ type: "cancel" });
  } catch {
    /* ignore */
  }
}

function ctx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** Decode + downmix to mono Float32Array. */
export async function toMono(buffer: AudioBuffer): Promise<Float32Array> {
  const channels = buffer.numberOfChannels;
  const len = buffer.length;
  const out = new Float32Array(len);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += data[i] / channels;
  }
  return out;
}

export async function decodeBytes(bytes: ArrayBuffer): Promise<AudioBuffer> {
  return ctx().decodeAudioData(bytes.slice(0));
}

/* ------------------------------- capture ------------------------------- */
export interface RecordingHandle {
  finished: Promise<Float32Array>;
  sampleRate: number;
  stop: () => void;
  analyser: AnalyserNode;
}

/** Record `seconds` from the mic; resolves with mono PCM. */
export async function recordMono(seconds: number, onLevel?: (level: number) => void, shouldCancel?: () => boolean): Promise<RecordingHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const ac = ctx();
  const source = ac.createMediaStreamSource(stream);
  const analyser = ac.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  let stopped = false;
  const finished = new Promise<Float32Array>((resolve, reject) => {
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      window.clearInterval(levelTimer);
      try {
        const blob = new Blob(chunks, { type: mime || "audio/webm" });
        const decoded = await decodeBytes(await blob.arrayBuffer());
        resolve(await toMono(decoded));
      } catch (err) {
        reject(err);
      }
    };
    rec.onerror = () => reject(new Error("Recording failed"));
  });

  rec.start();
  const levelData = new Uint8Array(analyser.frequencyBinCount);
  const levelTimer = window.setInterval(() => {
    if (shouldCancel?.()) {
      if (rec.state !== "inactive") rec.stop();
      return;
    }
    analyser.getByteTimeDomainData(levelData as Uint8Array<ArrayBuffer>);
    let peak = 0;
    for (let i = 0; i < levelData.length; i++) peak = Math.max(peak, Math.abs(levelData[i] - 128) / 128);
    onLevel?.(peak);
  }, 70); // ~14 fps: cheap enough to keep the UI smooth

  window.setTimeout(() => {
    if (!stopped && rec.state !== "inactive") {
      stopped = true;
      rec.stop();
    }
  }, seconds * 1000);

  return {
    finished,
    sampleRate: ac.sampleRate,
    analyser,
    stop: () => {
      if (rec.state !== "inactive") {
        stopped = true;
        rec.stop();
      }
    },
  };
}

export async function monoFromFile(file: File): Promise<{ samples: Float32Array; sampleRate: number }> {
  const decoded = await decodeBytes(await file.arrayBuffer());
  return { samples: await toMono(decoded), sampleRate: decoded.sampleRate };
}

/* ----------------------------- fingerprint ----------------------------- */
interface WorkerFingerprint {
  hashes: Int32Array;
  times: Int32Array;
  env: Float32Array;
  frames: number;
  sampleRate: number;
  hop: number;
}

async function fingerprintInWorker(samples: Float32Array, sampleRate: number): Promise<WorkerFingerprint | null> {
  const copy = Float32Array.from(samples);
  const res = await post("fingerprint", { samples: copy, sampleRate }, [copy.buffer]);
  return res?.type === "fingerprinted" ? (res.fp as WorkerFingerprint) : null;
}

function toStored(id: string, fp: WorkerFingerprint, song: Song): StoredFingerprint {
  return {
    id,
    hashes: fp.hashes.buffer.slice(0) as ArrayBuffer,
    times: fp.times.buffer.slice(0) as ArrayBuffer,
    env: fp.env.buffer.slice(0) as ArrayBuffer,
    frames: fp.frames,
    sampleRate: fp.sampleRate,
    hop: fp.hop,
    meta: { title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration },
    builtAt: Date.now(),
  };
}

function fromStored(stored: StoredFingerprint): WorkerFingerprint {
  return {
    hashes: new Int32Array(stored.hashes),
    times: new Int32Array(stored.times),
    env: new Float32Array(stored.env),
    frames: stored.frames,
    sampleRate: stored.sampleRate,
    hop: stored.hop,
  };
}

/** Pull the opening seconds of a catalogue track through our own proxy. */
async function fetchCandidateMono(songId: string, bytes = 262_144, signal?: AbortSignal): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  try {
    const res = await fetch(`/api/audio/${encodeURIComponent(songId)}?title=&artist=`, { headers: { Range: `bytes=0-${bytes}` }, signal });
    if (!res.ok && res.status !== 206) return null;
    const data = await res.arrayBuffer();
    if (data.byteLength < 24_000) return null;
    const decoded = await decodeBytes(data);
    return { samples: await toMono(decoded), sampleRate: decoded.sampleRate };
  } catch {
    return null;
  }
}

export interface CorpusStats {
  total: number;
  cached: number;
  built: number;
  failed: number;
  ms: number;
}

/**
 * Ensure every corpus track has a cached fingerprint. Lazy, cancellable, and
 * concurrent-limited so the main thread stays interactive.
 */
export async function ensureFingerprints(
  songs: Song[],
  opts: { onProgress?: (done: number, total: number, song: Song) => void; shouldCancel?: () => boolean; signal?: AbortSignal; concurrency?: number } = {}
): Promise<{ fps: { id: string; song: Song; fp: WorkerFingerprint }[]; stats: CorpusStats }> {
  const started = performance.now();
  const { onProgress, shouldCancel, signal, concurrency = 3 } = opts;
  const fps: { id: string; song: Song; fp: WorkerFingerprint }[] = [];
  let cached = 0;
  let built = 0;
  let failed = 0;
  let done = 0;

  const queue = [...songs];
  const workerTask = async () => {
    while (queue.length) {
      if (shouldCancel?.()) return;
      const song = queue.shift();
      if (!song) return;
      try {
        const stored = await getFingerprint(song.id);
        if (stored) {
          fps.push({ id: song.id, song, fp: fromStored(stored) });
          cached++;
        } else {
          const audio = await fetchCandidateMono(song.id, 262_144, signal);
          if (!audio) {
            failed++;
          } else {
            const fp = await fingerprintInWorker(audio.samples, audio.sampleRate);
            if (fp) {
              fps.push({ id: song.id, song, fp });
              built++;
              void putFingerprint(toStored(song.id, fp, song));
            } else failed++;
          }
        }
      } catch {
        failed++;
      } finally {
        done++;
        onProgress?.(done, songs.length, song);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, workerTask));
  return { fps, stats: { total: songs.length, cached, built, failed, ms: performance.now() - started } };
}

/* -------------------------------- matching -------------------------------- */
export interface MatchOutcome {
  results: MatchResult[];
  matchMs: number;
  verdict: "solid" | "ambiguous" | "none";
}

export async function matchFingerprint(
  clip: WorkerFingerprint,
  corpus: { id: string; song: Song; fp: WorkerFingerprint }[],
  shouldCancel?: () => boolean
): Promise<MatchOutcome> {
  const started = performance.now();
  const res = await post(
    "match",
    {
      clip,
      candidates: corpus.map((c) => ({ id: c.id, fp: c.fp })),
    },
    []
  );
  const matchMs = performance.now() - started;
  if (shouldCancel?.() || res?.type !== "matched") return { results: [], matchMs, verdict: "none" };

  const byId = new Map(corpus.map((c) => [c.id, c.song]));
  const results: MatchResult[] = (res.results as any[])
    .filter((r) => byId.has(r.id))
    .map((r) => ({ song: byId.get(r.id) as Song, score: r.score, offsetSeconds: r.offsetSeconds, hashRatio: r.hashRatio, envScore: r.envScore }));

  const best = results[0]?.score || 0;
  const second = results[1]?.score || 0;
  const verdict: MatchOutcome["verdict"] = best >= SOLID_CONFIDENCE && best - second >= 0.04 ? "solid" : best >= AMBIGUOUS_CONFIDENCE ? "ambiguous" : "none";
  return { results, matchMs, verdict };
}

/* --------------------------------- corpus --------------------------------- */
export async function loadCorpus(params: { scope?: string; section?: string; limit?: number } = {}): Promise<CorpusResponse> {
  const qs = new URLSearchParams({ scope: params.scope || "catalog", limit: String(params.limit || 18) });
  if (params.section) qs.set("section", params.section);
  const res = await fetch(`/api/recognize/corpus?${qs.toString()}`);
  if (!res.ok) throw new Error(`Corpus request failed (${res.status})`);
  return res.json();
}

/** Full recognition run with timings for corpus load / fingerprint build / match. */
export async function recognizeClip(opts: {
  samples: Float32Array;
  sampleRate: number;
  corpus: Song[];
  onProgress?: (done: number, total: number, song: Song) => void;
  shouldCancel?: () => boolean;
  signal?: AbortSignal;
}): Promise<{ outcome: MatchOutcome; timings: Timings; stats: CorpusStats }> {
  const totalStart = performance.now();
  const clipStart = performance.now();
  const clip = await fingerprintInWorker(opts.samples, opts.sampleRate);
  const fingerprintMs = performance.now() - clipStart;
  if (!clip) throw new Error("Could not fingerprint the clip");

  const { fps, stats } = await ensureFingerprints(opts.corpus, {
    onProgress: opts.onProgress,
    shouldCancel: opts.shouldCancel,
    signal: opts.signal,
  });
  if (opts.shouldCancel?.()) return { outcome: { results: [], matchMs: 0, verdict: "none" }, timings: { corpusMs: 0, fingerprintMs, matchMs: 0, totalMs: performance.now() - totalStart }, stats };

  const outcome = await matchFingerprint(clip, fps, opts.shouldCancel);
  return {
    outcome,
    timings: { corpusMs: stats.ms, fingerprintMs, matchMs: outcome.matchMs, totalMs: performance.now() - totalStart },
    stats,
  };
}
