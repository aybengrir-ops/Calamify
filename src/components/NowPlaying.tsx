"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronDown, Heart, ListMusic, Pause, Play, Radio, Repeat, Repeat1, Share2, Shuffle, SkipBack, SkipForward, Mic2 } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { Visualizer } from "@/components/Visualizer";
import { LyricsDisplay } from "@/components/LyricsDisplay";
import { formatDuration } from "@/lib/types";
import { dedupeCanonical } from "@/lib/dedupe";
import { cn } from "@/lib/cn";

/** Full-screen "Now Playing" experience: vinyl, synced lyrics, visualizer, queue. */
export function NowPlayingView() {
  const { current, playing, position, duration, toggle, next, prev, seek, shuffle, repeat, setShuffle, cycleRepeat, setExpanded, queue, index, jumpTo, setQueueOpen, lyricsOpen, setLyricsOpen, rate, cycleRate } = usePlayer();
  const { isLiked, toggleLike } = useSession();
  const { toast } = useUi();
  const showLyrics = lyricsOpen;
  const setShowLyrics = setLyricsOpen;

  useEffect(() => {
    if (!usePlayer.getState().lyricsOpen && usePlayer.getState().expanded) setLyricsOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if (e.key === " " && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setExpanded, toggle, setLyricsOpen]);

  if (!current) return null;
  const total = duration || current.duration || 0;
  const pct = total ? (position / total) * 100 : 0;

  const share = async () => {
    const url = `${window.location.origin}/search?q=${encodeURIComponent(`${current.title} ${current.artist}`)}`;
    try {
      if (navigator.share) await navigator.share({ title: current.title, text: `${current.title} — ${current.artist} on Calamify`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard", "success");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#05060f]/45 backdrop-blur-2xl"
    >
      {/* backdrop = the track artwork, heavily blurred (cross-fades per track) */}
      <div className="now-playing-bg" aria-hidden key={current.id}>
        {current.thumbnail ? (
          <div className="now-playing-bg-image" style={{ backgroundImage: `url(${current.thumbnail})` }} />
        ) : (
          <div className="now-playing-bg-image now-playing-bg-fallback" />
        )}
        <div className="now-playing-bg-overlay" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="nebula animate-float" style={{ width: 700, height: 700, left: "-10%", top: "-10%", background: "radial-gradient(circle, rgba(123,47,247,0.6), transparent 70%)" }} />
        <div className="nebula animate-float" style={{ width: 600, height: 600, right: "-8%", bottom: "-12%", background: "radial-gradient(circle, rgba(0,212,255,0.45), transparent 70%)", animationDelay: "3s" }} />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(false)} aria-label="Collapse player" className="glass-btn flex h-10 w-10 items-center justify-center rounded-full !px-0">
            <ChevronDown className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">Now playing</p>
            <p className="text-[11px] text-white/45">{current.source === "audius" ? "Full-length lossless stream" : "Innertube stream via Calamify proxy"}</p>
          </div>
          <button onClick={() => setQueueOpen(true)} aria-label="Open queue" className="glass-btn flex h-10 w-10 items-center justify-center rounded-full !px-0">
            <ListMusic className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* artwork */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-violet-600/40 via-transparent to-cyan-400/30 blur-3xl" />
            <div className="animate-orbit absolute -inset-6 rounded-full border border-white/10" />
            <div className="animate-orbit absolute -inset-14 rounded-full border border-white/5" style={{ animationDuration: "46s", animationDirection: "reverse" }} />
            <motion.div
              key={current.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 20 }}
              className={cn("glass-strong relative aspect-square overflow-hidden rounded-[28px] p-2", playing && "animate-float")}
            >
              {current.thumbnail ? (
                <>
                  <img src={current.thumbnail} alt={`${current.title} artwork`} className="now-playing-art h-full w-full rounded-[22px] object-cover" />
                  <span className="art-glass-reflection" />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-700/50 to-cyan-500/40 text-6xl">🌌</div>
              )}
            </motion.div>
            <div className="mt-5">
              <Visualizer circular height={120} bars={56} className="mx-auto w-full max-w-[280px]" />
            </div>
          </div>

          {/* meta + lyrics */}
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">{current.title}</h2>
              <Link href={`/artist/${encodeURIComponent(current.artist)}`} onClick={() => setExpanded(false)} className="mt-1 inline-block text-base text-white/60 transition hover:text-cyan-200 sm:text-lg">
                {current.artist}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("glass-badge px-2.5 py-1", current.source === "audius" ? "text-cyan-200" : "text-white/60")}>{current.source === "audius" ? "◉ full stream" : "▶ innertube"}</span>
                {current.genre && <span className="glass-badge px-2.5 py-1 text-violet-200">{current.genre}</span>}
                {current.views && <span className="glass-badge px-2.5 py-1 text-white/50">{current.views}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => void toggleLike(current)} aria-label="Like" className={cn("glass-btn flex h-11 w-11 items-center justify-center rounded-full !px-0", isLiked(current.id) && "border-pink-300/60 text-pink-200")}>
                <Heart className={cn("h-5 w-5", isLiked(current.id) && "animate-heart fill-pink-400")} />
              </button>
              <button onClick={share} aria-label="Share" className="glass-btn flex h-11 w-11 items-center justify-center rounded-full !px-0">
                <Share2 className="h-5 w-5" />
              </button>
              <button onClick={() => setShowLyrics(!showLyrics)} aria-label="Toggle lyrics" className={cn("glass-btn flex h-11 items-center gap-2 rounded-full px-4 text-xs font-medium", showLyrics && "border-cyan-300/60 text-cyan-200")}>
                <Mic2 className="h-4 w-4" /> Lyrics
              </button>
            </div>

            {/* progress */}
            <div className="glass-soft p-3">
              <div className="flex items-center gap-3">
                <span className="w-10 text-right text-[11px] tabular-nums text-white/60">{formatDuration(position)}</span>
                <div
                  className="progress-track group relative h-2 flex-1 cursor-pointer touch-none select-none"
                  onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (!rect.width) return;
                    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    if (!isNaN(percent)) usePlayer.getState().seekPercent(percent);
                  }}
                >
                  <div className="progress-fill absolute inset-y-0 left-0" style={{ width: `${pct}%` }} />
                  <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(0,212,255,0.9)]" style={{ left: `${pct}%` }} />
                </div>
                <span className="w-10 text-[11px] tabular-nums text-white/60">{formatDuration(total)}</span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <button onClick={() => setShuffle(!shuffle)} aria-label="Shuffle" className={cn("glass-btn flex h-10 w-10 items-center justify-center rounded-full !px-0", shuffle && "border-cyan-300/60 text-cyan-200")}>
                  <Shuffle className="h-4 w-4" />
                </button>
                <button onClick={() => prev()} aria-label="Previous" className="glass-btn flex h-12 w-12 items-center justify-center rounded-full !px-0">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button onClick={() => toggle()} aria-label={playing ? "Pause" : "Play"} className="glass-btn glass-btn-primary flex h-16 w-16 items-center justify-center rounded-full !px-0">
                  {playing ? <Pause className="h-7 w-7 fill-white" /> : <Play className="ml-1 h-7 w-7 fill-white" />}
                </button>
                <button onClick={() => next()} aria-label="Next" className="glass-btn flex h-12 w-12 items-center justify-center rounded-full !px-0">
                  <SkipForward className="h-5 w-5" />
                </button>
                <button
                onClick={cycleRate}
                aria-label="Playback speed"
                title="Playback speed — lyrics follow the audio clock"
                className={cn("glass-btn flex h-10 items-center justify-center rounded-full px-3 text-[11px] font-bold tabular-nums", rate !== 1 && "border-amber-300/60 text-amber-200")}
              >
                {rate}×
              </button>
              <button onClick={cycleRepeat} aria-label="Repeat" className={cn("glass-btn flex h-10 w-10 items-center justify-center rounded-full !px-0", repeat !== "off" && "border-cyan-300/60 text-cyan-200")}>
                  {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* animated synced lyrics */}
            {showLyrics && <LyricsDisplay />}

            {/* up next */}
            {queue.length > 1 && (
              <div className="glass-soft p-3">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/70">Up next</p>
                <div className="space-y-1">
                  {queue.slice(index + 1, index + 5).map((s, i) => (
                    <button key={`${s.id}-${i}`} onClick={() => jumpTo(index + 1 + i)} className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-white/10">
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                        {s.thumbnail && <img src={s.thumbnail} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-white/85">{s.title}</span>
                        <span className="block truncate text-[10px] text-white/45">{s.artist}</span>
                      </span>
                      <span className="text-[10px] tabular-nums text-white/40">{formatDuration(s.duration)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
