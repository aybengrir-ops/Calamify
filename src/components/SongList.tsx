"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Clock3, Download, Heart, MoreHorizontal, Play, Radio } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useOffline } from "@/store/offline";
import { copyrightLabel, formatDuration, type Song } from "@/lib/types";
import { cn } from "@/lib/cn";

export function SongThumb({ song, className = "", size = "md" }: { song: Song; className?: string; size?: "sm" | "md" | "lg" }) {
  const [broken, setBroken] = useState(false);
  const dims = size === "sm" ? "h-10 w-10 rounded-lg" : size === "lg" ? "h-full w-full rounded-2xl" : "h-12 w-12 rounded-xl";
  return (
    <span className={cn("relative block shrink-0 overflow-hidden border border-white/12 bg-gradient-to-br from-violet-700/40 to-cyan-500/30", dims, className)}>
      {song.thumbnail && !broken ? (
        <img src={song.thumbnail} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg">🪐</span>
      )}
    </span>
  );
}

export function LikeButton({ song, className = "" }: { song: Song; className?: string }) {
  const { isLiked, toggleLike } = useSession();
  const liked = isLiked(song.id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleLike(song);
      }}
      aria-label={liked ? `Unlike ${song.title}` : `Like ${song.title}`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
        liked
          ? "border-pink-300/60 bg-pink-500/15 text-pink-200 shadow-[0_0_18px_-4px_rgba(255,46,151,0.9)]"
          : "border-white/10 bg-white/5 text-white/40 opacity-70 hover:border-pink-300/40 hover:text-pink-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "animate-heart fill-pink-400")} />
    </button>
  );
}

export function SourceBadge({ song }: { song: Song }) {
  return (
    <span className={cn("glass-badge hidden px-2 py-0.5 text-[9px] sm:inline-flex", song.source === "audius" ? "text-cyan-200" : "text-white/50")}>
      {song.source === "audius" ? "◉ full" : "▶ yt"}
    </span>
  );
}

/* ------------------------- row (list layout) ------------------------- */
export function SongRow({ song, context, position, showAlbum = true }: { song: Song; context?: Song[]; position?: number; showAlbum?: boolean }) {
  const { playSong, current, playing, toggle } = usePlayer();
  const { openContextMenu } = useUi();
  const isCurrent = current?.id === song.id;
  const list = context && context.length ? context : [song];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group glass-soft flex items-center gap-3 p-2.5 transition-all duration-300 hover:border-cyan-300/35 hover:bg-white/10",
        isCurrent && "border-cyan-300/45 bg-cyan-400/10 shadow-[0_0_30px_-14px_rgba(0,212,255,0.9)]"
      )}
    >
      <div className="relative">
        <SongThumb song={song} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isCurrent) toggle();
            else playSong(song, list);
          }}
          aria-label={isCurrent && playing ? `Pause ${song.title}` : `Play ${song.title}`}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 transition-opacity duration-300",
            isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isCurrent && playing ? (
            <span className="flex h-4 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="eq-bar w-[3px] rounded-full bg-cyan-200" style={{ height: 14, animationDelay: `${i * 0.16}s` }} />
              ))}
            </span>
          ) : (
            <Play className="h-4 w-4 fill-white text-white" />
          )}
        </button>
        {typeof position === "number" && <span className="absolute -left-5 top-1/2 hidden -translate-y-1/2 text-[11px] tabular-nums text-white/30 lg:block">{position + 1}</span>}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13px] font-medium", isCurrent ? "text-cyan-200" : "text-white")}>{song.title}</p>
        <p className="truncate text-[11.5px] text-white/50">
          <Link href={`/artist/${encodeURIComponent(song.artist)}`} className="transition hover:text-cyan-200">
            {song.artist}
          </Link>
          {showAlbum && song.album && song.album !== song.title && <span className="text-white/25"> · {song.album}</span>}
        </p>
      </div>

      {song.level && <span className="glass-badge hidden px-2 py-0.5 text-[9px] text-emerald-200 xl:inline-flex">🎮 {song.level}</span>}
      {copyrightLabel(song) && <span className="glass-badge hidden px-2 py-0.5 text-[9px] text-emerald-200 lg:inline-flex">✓ free</span>}
      {song.genre && !song.level && <span className="glass-badge hidden px-2 py-0.5 text-[9px] text-violet-200 xl:inline-flex">{song.genre}</span>}
      <SourceBadge song={song} />
      <LikeButton song={song} />
      <span className="hidden w-12 text-right text-[11px] tabular-nums text-white/40 sm:block">{formatDuration(song.duration)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openContextMenu(song, rect.left, rect.bottom + 6, list);
        }}
        aria-label={`More options for ${song.title}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/35 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function SongList({ songs, showAlbum = true, numbered = true }: { songs: Song[]; showAlbum?: boolean; numbered?: boolean }) {
  return (
    <div className="space-y-2">
      {songs.map((s, i) => (
        <SongRow key={`${s.id}-${i}`} song={s} context={songs} position={numbered ? i : undefined} showAlbum={showAlbum} />
      ))}
    </div>
  );
}

/* ------------------------- card (grid layout) ------------------------- */
export function SongCard({ song, context, index = 0 }: { song: Song; context?: Song[]; index?: number }) {
  const { playSong, current, playing } = usePlayer();
  const { openContextMenu } = useUi();
  const isCurrent = current?.id === song.id;
  const list = context && context.length ? context : [song];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
      className="glass glass-card group relative overflow-hidden p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">🌠</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <button
          onClick={() => playSong(song, list)}
          aria-label={`Play ${song.title}`}
          className={cn(
            "glass-btn glass-btn-primary absolute bottom-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-full !px-0 transition-all duration-300",
            isCurrent ? "opacity-100" : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          <Play className="ml-0.5 h-4 w-4 fill-white" />
        </button>
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <SourceBadge song={song} />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-[13.5px] font-semibold", isCurrent ? "text-cyan-200" : "text-white")}>{song.title}</p>
          <Link href={`/artist/${encodeURIComponent(song.artist)}`} className="block truncate text-[11.5px] text-white/50 transition hover:text-cyan-200">
            {song.artist}
          </Link>
        </div>
        <LikeButton song={song} className="opacity-100" />
        <CardDownloadButton song={song} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10.5px] text-white/35">
          <Clock3 className="h-3 w-3" /> {formatDuration(song.duration)}
        </span>
        <span className="flex items-center gap-2">
          {copyrightLabel(song) && <span className="glass-badge px-2 py-0.5 text-[9px] text-emerald-200">✓ free</span>}
          {song.genre && !copyrightLabel(song) && <span className="glass-badge px-2 py-0.5 text-[9px] text-violet-200">{song.genre}</span>}
          <button onClick={() => openContextMenu(song, 0, 0, list)} aria-label="More" className="text-white/35 transition hover:text-white">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </span>
      </div>
    </motion.div>
  );
}

function CardDownloadButton({ song }: { song: Song }) {
  const downloaded = useOffline((s) => s.tracks.some((t) => t.id === song.id));
  const downloading = useOffline((s) => Boolean(s.downloading[song.id]));
  const percent = useOffline((s) => s.progress[song.id] || 0);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (downloaded) void useOffline.getState().remove(song.id);
        else void useOffline.getState().download(song);
      }}
      aria-label={downloaded ? "Remove download" : "Download for offline"}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full border transition",
        downloaded ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_16px_-4px_rgba(0,212,255,0.9)]" : "border-white/10 bg-white/5 text-white/40 hover:text-cyan-200"
      )}
    >
      <Download className="h-3.5 w-3.5" />
      {downloading && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(0,212,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - percent / 100)} />
        </svg>
      )}
    </button>
  );
}

export function SongGrid({ songs, cols = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }: { songs: Song[]; cols?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:gap-4", cols)}>
      {songs.map((s, i) => (
        <SongCard key={`${s.id}-${i}`} song={s} context={songs} index={i} />
      ))}
    </div>
  );
}

/* ------------------------- horizontal carousel ------------------------- */
export function SongCarousel({ songs }: { songs: Song[] }) {
  return (
    <div className="no-scrollbar snap-x-mandatory -mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
      {songs.map((s, i) => (
        <div key={`${s.id}-${i}`} className="snap-start-item w-[210px] shrink-0 sm:w-[230px]">
          <SongCard song={s} context={songs} index={i} />
        </div>
      ))}
    </div>
  );
}

export function QuickPlayButton({ songs, label = "Play all", className = "" }: { songs: Song[]; label?: string; className?: string }) {
  const { playContext } = usePlayer();
  return (
    <button onClick={() => playContext(songs, 0)} className={cn("glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold", className)}>
      <Play className="h-4 w-4 fill-white" /> {label}
    </button>
  );
}

export function ShuffleButton({ songs, className = "" }: { songs: Song[]; className?: string }) {
  const { playContext, setShuffle } = usePlayer();
  return (
    <button
      onClick={() => {
        setShuffle(true);
        const shuffled = [...songs].sort(() => Math.random() - 0.5);
        playContext(shuffled, 0);
      }}
      className={cn("glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold", className)}
    >
      <Radio className="h-4 w-4" /> Shuffle
    </button>
  );
}
