"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioLines, Disc3, Heart, ListPlus, Mic, Play, Search, UploadCloud, Waves, X } from "lucide-react";
import { GlassBadge, GlassButton, SectionTitle } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import {
  AMBIGUOUS_CONFIDENCE,
  SOLID_CONFIDENCE,
  cancelWorker,
  loadCorpus,
  matchFingerprint,
  monoFromFile,
  recordMono,
  recognizeClip,
  type CorpusResponse,
  type MatchResult,
  type Phase,
  type Timings,
} from "@/lib/recognizer";
import { playMatchChime, playNoMatch, playScanBlip, playScanStart, playSwoosh } from "@/lib/soundEffects";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

const CLIP_SECONDS = 7;

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Ready",
  listening: "Listening…",
  processing: "Processing…",
  matching: "Matching…",
  matched: "Matched",
  nomatch: "No solid match yet",
  cancelled: "Cancelled",
  error: "Something went wrong",
};

/**
 * 🎙️ Song recognition against the curated Calamify catalogue only.
 * Client-side DSP in a Web Worker, fingerprints cached in IndexedDB.
 */
export function Recognizer() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scope, setScope] = useState<"catalog" | "library" | "trending">("catalog");
  const [section, setSection] = useState<string>("");
  const [corpus, setCorpus] = useState<Song[]>([]);
  const [sections, setSections] = useState<CorpusResponse["sections"]>([]);
  const [level, setLevel] = useState(0);
  const [progress, setProgress] = useState(0);
  const [probe, setProbe] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [verdict, setVerdict] = useState<"solid" | "ambiguous" | "none" | null>(null);
  const [timings, setTimings] = useState<Timings | null>(null);
  const [stats, setStats] = useState<{ cached: number; built: number; failed: number } | null>(null);
  const [message, setMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(CLIP_SECONDS);
  const cancelRef = useRef(false);
  const recorderRef = useRef<{ stop: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { playSong } = usePlayer();
  const { toast, setAddToPlaylistSong } = useUi();

  useEffect(() => {
    let alive = true;
    loadCorpus({ scope: "catalog", limit: 18 })
      .then((d) => {
        if (!alive) return;
        setSections(d.sections || []);
        setCorpus(d.songs || []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const reloadCorpus = async (nextScope: typeof scope, nextSection: string) => {
    setPhase("idle");
    setResults([]);
    setVerdict(null);
    try {
      const d = await loadCorpus({ scope: nextScope, section: nextSection, limit: nextScope === "catalog" && !nextSection ? 18 : 20 });
      setCorpus(d.songs || []);
      setSections(d.sections || []);
      if (d.duplicatesRemoved) toast(`Corpus deduped: ${d.duplicatesRemoved} repeats removed`, "info");
    } catch {
      toast("Could not load the recognition corpus", "error");
    }
  };

  const cancel = () => {
    cancelRef.current = true;
    cancelWorker();
    recorderRef.current?.stop();
    setPhase("cancelled");
    setLevel(0);
    setMessage("Recognition cancelled.");
  };

  const runWith = async (samples: Float32Array, sampleRate: number) => {
    cancelRef.current = false;
    setResults([]);
    setVerdict(null);
    setPhase("processing");
    setMessage("");
    playScanStart();
    try {
      setPhase("matching");
      const { outcome, timings: t, stats: s } = await recognizeClip({
        samples,
        sampleRate,
        corpus,
        onProgress: (done, total, song) => {
          setProgress(done / total);
          setProbe(song.title);
          if (done % 3 === 0) playScanBlip(done);
        },
        shouldCancel: () => cancelRef.current,
      });
      if (cancelRef.current) {
        setPhase("cancelled");
        return;
      }
      setTimings(t);
      setStats({ cached: s.cached, built: s.built, failed: s.failed });
      setResults(outcome.results.slice(0, 5));
      setVerdict(outcome.verdict);
      setPhase(outcome.verdict === "none" ? "nomatch" : "matched");
      if (outcome.verdict === "none") {
        playNoMatch();
      } else {
        playMatchChime();
        const best = outcome.results[0];
        toast(
          outcome.verdict === "solid"
            ? `Recognized: ${best.song.title} — ${best.song.artist} (${Math.round(best.score * 100)}%)`
            : `Not sure yet — here are the ${Math.min(3, outcome.results.length)} closest matches`,
          outcome.verdict === "solid" ? "success" : "info"
        );
      }
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Recognition failed");
      playNoMatch();
    } finally {
      setProgress(0);
      setProbe("");
    }
  };

  const startListening = async () => {
    if (!corpus.length) {
      setPhase("error");
      setMessage("The corpus is still loading — pick a section below and try again.");
      return;
    }
    cancelRef.current = false;
    setPhase("listening");
    setSecondsLeft(CLIP_SECONDS);
    setMessage("");
    try {
      const started = Date.now();
      const ticker = window.setInterval(() => {
        const left = Math.max(0, CLIP_SECONDS - (Date.now() - started) / 1000);
        setSecondsLeft(left);
        if (left <= 0) window.clearInterval(ticker);
      }, 90);
      const handle = await recordMono(CLIP_SECONDS, (peak) => setLevel(peak), () => cancelRef.current);
      recorderRef.current = handle;
      const samples = await handle.finished;
      window.clearInterval(ticker);
      setLevel(0);
      if (cancelRef.current) {
        setPhase("cancelled");
        return;
      }
      await runWith(samples, handle.sampleRate);
    } catch (err) {
      setPhase("error");
      setMessage(
        err instanceof Error && /Permission|NotAllowed/i.test(err.message)
          ? "Microphone permission denied. Allow it in your browser, or use file upload instead."
          : "Recording is not supported here — use file upload instead."
      );
      playNoMatch();
    }
  };

  const onFile = async (file: File) => {
    if (!corpus.length) {
      setPhase("error");
      setMessage("The corpus is still loading — try again in a moment.");
      return;
    }
    cancelRef.current = false;
    setPhase("processing");
    playScanStart();
    try {
      const { samples, sampleRate } = await monoFromFile(file);
      await runWith(samples, sampleRate);
    } catch {
      setPhase("error");
      setMessage("That file could not be decoded. Try MP3, WAV, M4A or OGG.");
      playNoMatch();
    }
  };

  const busy = phase === "listening" || phase === "processing" || phase === "matching";
  const shown = useMemo(() => (verdict === "ambiguous" ? results.slice(0, 3) : results.slice(0, 1)), [results, verdict]);
  const countdown = 1 - secondsLeft / CLIP_SECONDS;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      {/* ── hero / scanner ── */}
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 text-center sm:p-10">
        <span className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,212,255,0.45), transparent 60%), linear-gradient(135deg,#7b2ff7,#0d1b2a)" }} />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <GlassBadge tone="cyan">
              <Waves className="h-3 w-3" /> Curated catalogue only
            </GlassBadge>
            <GlassBadge tone="purple">Web Worker DSP · IndexedDB cache</GlassBadge>
            <GlassBadge tone="gold">{corpus.length} tracks indexed</GlassBadge>
          </div>
          <h1 className="mt-3 flex items-center justify-center gap-3 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">
            <AudioLines className="h-8 w-8 text-cyan-200" /> Recognize a Song
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Record {CLIP_SECONDS} seconds or drop an audio file. Calamify fingerprints it (8 kHz resample, noise gate, constellation peaks),
            votes on band-pair hashes, then cross-correlates the envelope to report confidence and where in the track you are.
          </p>

          <div className="relative mx-auto mt-8 flex h-52 w-52 items-center justify-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("absolute rounded-full border", phase === "listening" ? "recognizer-ping-fast" : "recognizer-ping")}
                style={{
                  inset: `${i * 16}px`,
                  borderColor: phase === "listening" ? "rgba(255,46,151,0.55)" : busy ? "rgba(0,212,255,0.5)" : "rgba(167,139,250,0.35)",
                  animationDelay: `${i * 0.6}s`,
                }}
              />
            ))}
            {busy && <span className="recognizer-radar absolute inset-4 rounded-full" />}
            <button
              onClick={() => (busy ? cancel() : void startListening())}
              aria-label={busy ? "Cancel recognition" : "Start recognition"}
              className={cn("glass-btn glass-btn-primary relative flex h-28 w-28 items-center justify-center rounded-full !px-0 transition", phase === "idle" && "animate-pulse-ring")}
            >
              {phase === "listening" ? (
                <span className="flex h-12 items-end gap-[3px]">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="w-[4px] rounded-full bg-white" style={{ height: `${14 + level * 34}px`, transition: "height 70ms linear" }} />
                  ))}
                </span>
              ) : busy ? (
                <X className="h-9 w-9 text-white" />
              ) : (
                <Mic className="h-10 w-10 fill-white/20 text-white" />
              )}
            </button>
            {phase === "listening" && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="47" fill="none" stroke="url(#recgrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 47} strokeDashoffset={2 * Math.PI * 47 * (1 - countdown)} />
                <defs>
                  <linearGradient id="recgrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#ff2e97" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>

          {/* phase strip */}
          <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-1.5">
            {(["listening", "processing", "matching", verdict === "none" && phase !== "idle" ? "nomatch" : "matched"] as Phase[]).map((p) => {
              const order: Phase[] = ["listening", "processing", "matching", phase === "nomatch" ? "nomatch" : "matched"];
              const activeIndex = order.indexOf(phase);
              const myIndex = order.indexOf(p);
              const state = myIndex < activeIndex ? "done" : myIndex === activeIndex ? "active" : "todo";
              return (
                <span key={p} className={cn("glass-badge flex-1 px-2 py-1 text-[9.5px] uppercase tracking-wider", state === "active" ? "border-cyan-300/70 text-cyan-100" : state === "done" ? "text-emerald-200/80" : "text-white/35")}>
                  {PHASE_LABEL[p]}
                </span>
              );
            })}
          </div>

          <p className="mt-3 min-h-[18px] text-[12px] text-white/60">
            {phase === "listening" && `Listening… ${secondsLeft.toFixed(1)}s left — play the song near your mic`}
            {phase === "processing" && "Decoding + fingerprinting your clip…"}
            {phase === "matching" && `Matching against ${corpus.length} tracks… ${Math.round(progress * 100)}% ${probe ? `· ${probe}` : ""}`}
            {phase === "error" && message}
            {phase === "cancelled" && message}
            {phase === "nomatch" && "No solid match yet"}
            {phase === "matched" && (verdict === "ambiguous" ? "Not certain — here are the closest three" : "Confident match")}
            {phase === "idle" && "Tap the orb to listen, or drop an audio file"}
          </p>

          {busy && (
            <div className="mx-auto mt-2 max-w-md">
              <div className="progress-track h-1.5">
                <div className="progress-fill" style={{ width: `${Math.round((phase === "matching" ? progress : 0.15) * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {busy ? (
              <GlassButton variant="danger" onClick={cancel} icon={<X className="h-4 w-4" />}>
                Cancel
              </GlassButton>
            ) : (
              <>
                <GlassButton variant="primary" onClick={() => void startListening()} icon={<Mic className="h-4 w-4" />}>
                  {phase === "matched" || phase === "nomatch" ? "Listen again" : "Start listening"}
                </GlassButton>
                <GlassButton onClick={() => fileRef.current?.click()} icon={<UploadCloud className="h-4 w-4" />}>
                  Upload audio file
                </GlassButton>
              </>
            )}
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          </div>
        </div>
      </motion.header>

      {/* ── corpus picker ── */}
      <section className="glass p-5">
        <SectionTitle eyebrow="Recognition corpus" title="Curated Calamify catalogue only" subtitle="Fingerprints are built lazily in your browser and cached in IndexedDB — never during build or deploy" />
        <div className="flex flex-wrap items-center gap-2">
          {(["catalog", "library", "trending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                playSwoosh();
                setScope(s);
                setSection("");
                void reloadCorpus(s, "");
              }}
              className={cn("glass-btn !rounded-full px-4 py-2 text-xs capitalize", scope === s && !section && "glass-btn-primary font-semibold")}
            >
              {s === "catalog" ? "🗂️ Catalogue mix" : s === "library" ? "♥ Your library" : "🔥 Trending"}
            </button>
          ))}
        </div>
        {scope === "catalog" && sections.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  playSwoosh();
                  setSection(s.id);
                  void reloadCorpus("catalog", s.id);
                }}
                className={cn("glass-btn shrink-0 !rounded-full px-3.5 py-1.5 text-[11px]", section === s.id && "glass-btn-primary font-semibold")}
              >
                {s.icon} {s.title}
                <span className="ml-1.5 text-[9.5px] opacity-60">{s.entries}</span>
              </button>
            ))}
          </div>
        )}
        {corpus.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {corpus.map((s) => (
              <span key={s.id} className="glass-soft flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3">
                <span className="h-7 w-7 overflow-hidden rounded-full border border-white/15">{s.thumbnail && <img src={s.thumbnail} alt="" className="h-full w-full object-cover" />}</span>
                <span className="max-w-[130px] truncate text-[11px] text-white/70">{s.title}</span>
              </span>
            ))}
          </div>
        )}
        {stats && (
          <p className="mt-3 text-[11px] text-white/45">
            Fingerprints: {stats.cached} from cache · {stats.built} built now · {stats.failed} unavailable
          </p>
        )}
      </section>

      {/* ── results ── */}
      <AnimatePresence mode="wait">
        {(phase === "matched" || phase === "nomatch") && (
          <motion.div key={phase + String(results.length)} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {phase === "nomatch" || verdict === "none" ? (
              <div className="glass-strong p-7 text-center">
                <p className="text-4xl">🌌</p>
                <h2 className="mt-3 font-display text-2xl font-bold text-white">No solid match yet</h2>
                <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/60">
                  Try recording <span className="text-cyan-200">2–3 seconds longer</span>, move <span className="text-cyan-200">closer to the speaker</span>, and reduce background noise.
                  You can also narrow the corpus to the section or artist you think it is — a tighter pool gives a sharper answer.
                </p>
                {results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Weak candidates</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {results.slice(0, 3).map((r) => (
                        <span key={r.song.id} className="glass-badge px-3 py-1.5 text-white/60">
                          {r.song.title} · {Math.round(r.score * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {verdict === "ambiguous" && (
                  <p className="glass-soft px-4 py-3 text-center text-[12.5px] text-white/65">
                    Not certain — here are the top {shown.length} candidates. Record a little longer for a single confident answer.
                  </p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {shown.map((r, i) => (
                    <ResultCard key={r.song.id} result={r} rank={i + 1} ambiguous={verdict === "ambiguous"} />
                  ))}
                </div>
              </>
            )}

            {results.length > shown.length && (
              <div>
                <SectionTitle eyebrow="Also considered" title="Runner-up candidates" />
                <div className="space-y-2">
                  {results.slice(shown.length).map((r, i) => (
                    <button key={r.song.id} onClick={() => playSong(r.song, results.map((x) => x.song))} className="glass-soft group flex w-full items-center gap-3 p-2.5 text-left transition hover:border-cyan-300/40 hover:bg-white/10">
                      <span className="w-6 text-center text-[11px] text-white/35">{shown.length + i + 1}</span>
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/12">{r.song.thumbnail && <img src={r.song.thumbnail} alt="" className="h-full w-full object-cover" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] text-white">{r.song.title}</span>
                        <span className="block truncate text-[11px] text-white/50">{r.song.artist}</span>
                      </span>
                      <span className="text-[12px] font-bold tabular-nums text-cyan-200">{Math.round(r.score * 100)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {timings && (
              <div className="glass p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-200/80">Timing log</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Corpus + fingerprints", value: timings.corpusMs },
                    { label: "Clip fingerprint", value: timings.fingerprintMs },
                    { label: "Match", value: timings.matchMs },
                    { label: "Total", value: timings.totalMs },
                  ].map((t) => (
                    <div key={t.label} className="glass-soft px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-white/40">{t.label}</p>
                      <p className="font-display text-sm font-bold tabular-nums text-white">{t.value.toFixed(0)} ms</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/40">
                  Solid ≥ {Math.round(SOLID_CONFIDENCE * 100)}% · ambiguous ≥ {Math.round(AMBIGUOUS_CONFIDENCE * 100)}% (shows top 3) · matching runs off the main thread
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({ result, rank, ambiguous }: { result: MatchResult; rank: number; ambiguous: boolean }) {
  const { song, score, offsetSeconds } = result;
  const { playSong } = usePlayer();
  const { toggleLike, isLiked } = useSession();
  const { setAddToPlaylistSong, toast } = useUi();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: rank * 0.06 }} className={cn("glass-strong relative overflow-hidden p-5", rank === 1 && !ambiguous && "border-emerald-300/50")}>
      <span className="absolute inset-0 opacity-30" style={{ background: rank === 1 && !ambiguous ? "linear-gradient(135deg,#22c55e,#00d4ff)" : "linear-gradient(135deg,#7b2ff7,#ff2e97)" }} />
      <div className="relative flex items-start gap-4">
        <span className="glass-strong flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-1">
          {song.thumbnail ? <img src={song.thumbnail} alt="" className="h-full w-full rounded-xl object-cover" /> : <Disc3 className="h-8 w-8 text-white/50" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">{ambiguous ? `Candidate #${rank}` : "Match found"}</p>
          <h3 className="truncate font-display text-xl font-bold text-white">{song.title}</h3>
          <p className="truncate text-[13px] text-white/60">{song.artist}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="glass-badge px-3 py-1 text-[11px] font-bold text-white">{Math.round(score * 100)}% confidence</span>
            <span className="glass-badge px-3 py-1 text-[10px] text-white/60">
              offset {offsetSeconds >= 0 ? "+" : ""}
              {offsetSeconds.toFixed(1)}s in track
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-3">
        <div className="progress-track h-2">
          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${Math.round(score * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap gap-2">
        <GlassButton variant="primary" size="sm" onClick={() => playSong(song)} icon={<Play className="h-3.5 w-3.5 fill-white" />}>
          Play
        </GlassButton>
        <GlassButton size="sm" onClick={() => void toggleLike(song)} icon={<Heart className={cn("h-3.5 w-3.5", isLiked(song.id) && "fill-pink-400 text-pink-300")} />}>
          {isLiked(song.id) ? "Liked" : "Like"}
        </GlassButton>
        <GlassButton size="sm" onClick={() => setAddToPlaylistSong(song)} icon={<ListPlus className="h-3.5 w-3.5" />}>
          Playlist
        </GlassButton>
        <a href={`/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`} className="glass-btn inline-flex items-center gap-2 px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5" /> Open track
        </a>
      </div>
      <p className="relative mt-3 text-[10.5px] text-white/35">
        hash match {(result.hashRatio * 100).toFixed(0)}% · envelope correlation {(result.envScore * 100).toFixed(0)}%
      </p>
    </motion.div>
  );
}
