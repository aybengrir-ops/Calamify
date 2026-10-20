"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ChevronUp,
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Radio,
} from "lucide-react";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { GlassSlider } from "@/components/ui/Glass";
import { formatDuration } from "@/lib/types";
import { cn } from "@/lib/cn";
import { radioApi } from "@/lib/api";
import { playSeekTick } from "@/lib/soundEffects";
import { useOffline } from "@/store/offline";
import { Download } from "lucide-react";

export function PlayerBar() {
  const {
    current,
    playing,
    status,
    position,
    duration,
    buffered,
    volume,
    muted,
    shuffle,
    repeat,
    expanded,
    queueOpen,
    lyricsOpen,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    setShuffle,
    cycleRepeat,
    setExpanded,
    setQueueOpen,
    setLyricsOpen,
    fallbackNotice,
    pendingSeekPercent,
    rate,
    cycleRate,
  } = usePlayer();

  const { isLiked, toggleLike } = useSession();
  const { openContextMenu, toast } = useUi();
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const total = duration || current?.duration || 0;
  const pct = total ? Math.min(100, (position / total) * 100) : pendingSeekPercent ?? 0;
  const bufferedPct = total ? Math.min(100, (buffered / total) * 100) : 0;

  const seekFromEvent = (clientX: number) => {
    const el = progressRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !isFinite(rect.width)) return;
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    if (isNaN(percent)) return;
    // percent-based: still lands correctly when metadata has not loaded yet
    usePlayer.getState().seekPercent(percent);
    playSeekTick();
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => seekFromEvent(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, total]);

  useEffect(() => {
    if (!fallbackNotice) return;
    toast(fallbackNotice, "info");
    usePlayer.getState()._setFallback(null);
  }, [fallbackNotice, toast]);

  if (!current) return null;

  const startRadio = async () => {
    try {
      toast("Tuning the radio dish…", "info");
      const data = await radioApi({ title: current.title, artist: current.artist, genre: current.genre, exclude: [current.id] });
      const list = data.results || [];
      if (list.length) {
        usePlayer.getState().playContext([current, ...list], 0);
        toast(`Radio started — ${list.length} similar tracks queued`, "success");
      }
    } catch {
      toast("Radio could not be tuned right now", "error");
    }
  };

  return (
    <>
      {/* mobile mini progress */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-0.5 bg-white/10 sm:hidden">
        <div className="h-full bg-gradient-to-r from-violet-400 via-cyan-300 to-pink-400" style={{ width: `${pct}%` }} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-4 sm:pb-3">
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="glass-strong mx-auto flex w-full max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4"
        >
          {/* left: artwork + meta */}
          <div
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 sm:flex-none sm:basis-[26%]"
            onClick={() => setExpanded(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setExpanded(true);
            }}
            title="Open full screen player"
          >
            <button onClick={() => setExpanded(true)} aria-label="Expand player" className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/20 sm:h-14 sm:w-14">
              {current.thumbnail ? (
                <img src={current.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/60 to-cyan-500/50 text-lg">🪐</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                <Maximize2 className="h-4 w-4 text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white sm:text-sm">{current.title}</p>
              <Link href={`/artist/${encodeURIComponent(current.artist)}`} className="block truncate text-[11px] text-white/55 transition hover:text-cyan-200 sm:text-xs">
                {current.artist}
              </Link>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={cn("glass-badge px-1.5 py-[1px] text-[8px]", current.source === "audius" ? "text-cyan-200" : "text-white/60")}>{current.source === "audius" ? "lossless stream" : "innertube"}</span>
                {status === "loading" && <span className="text-[9px] uppercase tracking-widest text-cyan-200/70">buffering…</span>}
                {status === "error" && <span className="text-[9px] uppercase tracking-widest text-pink-300">stream error</span>}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1 sm:ml-2">
              <DownloadButton />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleLike(current);
                }}
                aria-label={isLiked(current.id) ? "Unlike" : "Like"}
                className={cn("glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0", isLiked(current.id) && "border-pink-300/60 text-pink-200 shadow-[0_0_18px_-4px_rgba(255,46,151,0.9)]")}
              >
                <Heart className={cn("h-4 w-4", isLiked(current.id) && "animate-heart fill-pink-400")} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openContextMenu(current, e.clientX, e.clientY, usePlayer.getState().queue);
                }}
                aria-label="More options"
                className="glass-btn hidden h-9 w-9 items-center justify-center rounded-full !px-0 sm:flex"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* center: transport */}
          <div className="hidden flex-[1.4] flex-col items-center gap-1.5 md:flex">
            <div className="flex items-center gap-2">
              <button onClick={() => setShuffle(!shuffle)} aria-label="Shuffle" className={cn("glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0", shuffle && "border-cyan-300/60 text-cyan-200")}>
                <Shuffle className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => prev()} aria-label="Previous" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggle()}
                aria-label={playing ? "Pause" : "Play"}
                className={cn(
                  "glass-btn glass-btn-primary flex h-12 w-12 items-center justify-center rounded-full !px-0",
                  playing && "animate-pulse-ring"
                )}
              >
                {status === "loading" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : playing ? (
                  <Pause className="h-5 w-5 fill-white" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-white" />
                )}
              </button>
              <button onClick={() => next()} aria-label="Next" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
                <SkipForward className="h-4 w-4" />
              </button>
              <button onClick={cycleRepeat} aria-label="Repeat" className={cn("glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0", repeat !== "off" && "border-cyan-300/60 text-cyan-200")}>
                {repeat === "one" ? <Repeat1 className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex w-full items-center gap-2">
              <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-white/55">{formatDuration(position)}</span>
              <div
                ref={progressRef}
                className="progress-track group relative h-1.5 flex-1 cursor-pointer touch-none select-none"
                onPointerDown={(e) => {
                  setDragging(true);
                  seekFromEvent(e.clientX);
                }}
                onPointerMove={(e) => {
                  const rect = progressRef.current?.getBoundingClientRect();
                  if (rect && total) setHoverPos(((e.clientX - rect.left) / rect.width) * total);
                }}
                onPointerLeave={() => setHoverPos(null)}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(total)}
                aria-valuenow={Math.round(position)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") seek(Math.min(total, position + 5));
                  if (e.key === "ArrowLeft") seek(Math.max(0, position - 5));
                }}
              >
                <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `${bufferedPct}%` }} />
                <div className="progress-fill absolute inset-y-0 left-0" style={{ width: `${pct}%` }} />
                <span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_12px_rgba(0,212,255,0.9)] transition group-hover:opacity-100"
                  style={{ left: `${hoverPos !== null && total ? (hoverPos / total) * 100 : pct}%`, opacity: dragging ? 1 : undefined }}
                />
                {hoverPos !== null && (
                  <span className="glass-badge pointer-events-none absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 text-[9px] text-white/80" style={{ left: `${(hoverPos / (total || 1)) * 100}%` }}>
                    {formatDuration(hoverPos)}
                  </span>
                )}
              </div>
              <span className="w-10 shrink-0 text-[10px] tabular-nums text-white/55">{formatDuration(total)}</span>
            </div>
          </div>

          {/* right: utilities */}
          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <button
              onClick={cycleRate}
              aria-label="Playback speed"
              title="Playback speed ( [ / ] )"
              className={cn("glass-btn hidden h-9 items-center justify-center rounded-full px-2.5 text-[11px] font-bold tabular-nums lg:flex", rate !== 1 && "border-amber-300/60 text-amber-200")}
            >
              {rate}×
            </button>
            <button onClick={startRadio} aria-label="Start radio" className="glass-btn hidden h-9 w-9 items-center justify-center rounded-full !px-0 lg:flex">
              <Radio className="h-4 w-4" />
            </button>
            <button onClick={() => setLyricsOpen(!lyricsOpen)} aria-label="Lyrics" className={cn("glass-btn hidden h-9 w-9 items-center justify-center rounded-full !px-0 lg:flex", lyricsOpen && "border-cyan-300/60 text-cyan-200")}>
              <Mic2 className="h-4 w-4" />
            </button>
            <button onClick={() => setQueueOpen(!queueOpen)} aria-label="Queue" className={cn("glass-btn hidden h-9 w-9 items-center justify-center rounded-full !px-0 sm:flex", queueOpen && "border-cyan-300/60 text-cyan-200")}>
              <ListMusic className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : volume > 0.5 ? <Volume2 className="h-4 w-4" /> : <Volume1 className="h-4 w-4" />}
              </button>
              <GlassSlider value={muted ? 0 : volume} onChange={setVolume} label="Volume" className="w-20 lg:w-24" />
            </div>
            <button onClick={() => setExpanded(true)} aria-label="Full screen player" className="glass-btn hidden h-9 w-9 items-center justify-center rounded-full !px-0 sm:flex">
              <ChevronUp className="h-4 w-4" />
            </button>
            {/* mobile transport */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button onClick={() => prev()} aria-label="Previous" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={() => toggle()} aria-label={playing ? "Pause" : "Play"} className="glass-btn glass-btn-primary flex h-10 w-10 items-center justify-center rounded-full !px-0">
                {status === "loading" ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : playing ? <Pause className="h-4 w-4 fill-white" /> : <Play className="ml-0.5 h-4 w-4 fill-white" />}
              </button>
              <button onClick={() => next()} aria-label="Next" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* mobile scrub bar */}
        <div className="mx-auto mt-1.5 w-full max-w-[1500px] md:hidden">
          <div
            className="progress-track h-1.5 cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              if (!isNaN(percent)) {
                usePlayer.getState().seekPercent(percent);
                playSeekTick();
              }
            }}
          >
            <div className="progress-fill absolute inset-y-0 left-0" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <AnimatePresence>{expanded && <NowPlayingView />}</AnimatePresence>
      <AnimatePresence>{queueOpen && <QueuePanel />}</AnimatePresence>
      <LyricsPanel />
    </>
  );
}

function DownloadButton() {
  const current = usePlayer((s) => s.current);
  const downloaded = useOffline((s) => (current ? s.tracks.some((t) => t.id === current.id) : false));
  const downloading = useOffline((s) => (current ? Boolean(s.downloading[current.id]) : false));
  const percent = useOffline((s) => (current ? s.progress[current.id] || 0 : 0));
  if (!current) return null;
  return (
    <button
      onClick={() => (downloaded ? void useOffline.getState().remove(current.id) : void useOffline.getState().download(current))}
      aria-label={downloaded ? "Remove download" : downloading ? `Downloading ${percent}%` : "Download for offline"}
      title={downloaded ? "Downloaded — tap to remove" : downloading ? `Downloading ${percent}%` : "Download for offline"}
      className={cn(
        "glass-btn relative hidden h-9 w-9 items-center justify-center rounded-full !px-0 sm:flex",
        downloaded && "border-cyan-300/70 text-cyan-200 shadow-[0_0_18px_-4px_rgba(0,212,255,0.95)]"
      )}
    >
      <Download className="h-4 w-4" />
      {downloading && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(0,212,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - percent / 100)} />
        </svg>
      )}
    </button>
  );
}

/* Lazy imports keep the player bar bundle small */
import { NowPlayingView } from "@/components/NowPlaying";
import { QueuePanel } from "@/components/QueuePanel";
import { LyricsPanel } from "@/components/LyricsPanel";
