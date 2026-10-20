"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Disc3, Download, Heart, ListPlus, Play, PlusCircle, Radio, Share2, SkipForward, User, ListMusic } from "lucide-react";
import { useUi } from "@/store/ui";
import { useSession } from "@/store/session";
import { usePlayer } from "@/store/player";
import { useOffline } from "@/store/offline";
import { radioApi } from "@/lib/api";
import { cn } from "@/lib/cn";

export function ContextMenu() {
  const { contextMenu, closeContextMenu, setAddToPlaylistSong, toast } = useUi();
  const { isLiked, toggleLike } = useSession();
  const { playSong, playNextInQueue, addToQueue } = usePlayer();
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const song = contextMenu.song;
  const downloaded = useOffline((st) => (song ? st.tracks.some((t) => t.id === song.id) : false));
  const downloading = useOffline((st) => (song ? Boolean(st.downloading[song.id]) : false));
  const percent = useOffline((st) => (song ? st.progress[song.id] || 0 : 0));

  useEffect(() => {
    if (!song) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeContextMenu();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeContextMenu();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [song, closeContextMenu]);

  if (!song) return null;

  const items = [
    {
      label: "Play",
      icon: <Play className="h-4 w-4" />,
      onClick: () => playSong(song, contextMenu.context || [song]),
    },
    {
      label: "Play next",
      icon: <PlusCircle className="h-4 w-4" />,
      onClick: () => {
        playNextInQueue(song);
        toast(`"${song.title}" plays next`, "success");
      },
    },
    {
      label: "Add to queue",
      icon: <ListMusic className="h-4 w-4" />,
      onClick: () => {
        addToQueue(song);
        toast("Added to queue", "success");
      },
    },
    {
      label: isLiked(song.id) ? "Remove from Liked" : "Add to Liked Songs",
      icon: <Heart className={isLiked(song.id) ? "h-4 w-4 fill-pink-400 text-pink-300" : "h-4 w-4"} />,
      onClick: () => void toggleLike(song),
    },
    {
      label: "Add to playlist",
      icon: <ListPlus className="h-4 w-4" />,
      onClick: () => setAddToPlaylistSong(song),
    },
    {
      label: "Go to artist",
      icon: <User className="h-4 w-4" />,
      onClick: () => router.push(`/artist/${encodeURIComponent(song.artist)}`),
    },
    {
      label: "Go to album",
      icon: <Disc3 className="h-4 w-4" />,
      onClick: () => router.push(`/album/${encodeURIComponent(`${song.artist} — ${song.album || song.title}`)}`),
    },
    {
      label: "Start radio",
      icon: <Radio className="h-4 w-4" />,
      onClick: async () => {
        try {
          toast("Tuning radio…", "info");
          const data = await radioApi({ title: song.title, artist: song.artist, genre: song.genre, exclude: [song.id] });
          const list = data.results || [];
          if (list.length) {
            usePlayer.getState().playContext([song, ...list], 0);
            toast(`Radio: ${list.length} similar tracks queued`, "success");
          } else toast("No similar tracks found", "error");
        } catch {
          toast("Radio unavailable right now", "error");
        }
      },
    },
    {
      label: downloaded ? "Downloaded ✓ (remove)" : downloading ? `Downloading… ${percent}%` : "Download (offline)",
      icon: <Download className={cn("h-4 w-4", downloaded && "text-cyan-300")} />,
      onClick: async () => {
        if (downloaded) {
          await useOffline.getState().remove(song.id);
          return;
        }
        if (downloading) return;
        await useOffline.getState().download(song);
      },
    },
    {
      label: "Share",
      icon: <Share2 className="h-4 w-4" />,
      onClick: async () => {
        const url = `${window.location.origin}/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`;
        try {
          if (navigator.share) await navigator.share({ title: song.title, text: `${song.title} — ${song.artist}`, url });
          else {
            await navigator.clipboard.writeText(url);
            toast("Link copied", "success");
          }
        } catch {
          /* cancelled */
        }
      },
    },
    {
      label: "Skip forward 30s",
      icon: <SkipForward className="h-4 w-4" />,
      onClick: () => {
        const p = usePlayer.getState();
        p.seek(Math.min(p.duration || song.duration, p.position + 30));
      },
    },
  ];

  const style = {
    left: Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 260),
    top: Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 380),
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.94, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.16 }}
        style={style}
        className="glass-strong fixed z-[95] w-60 overflow-hidden p-1.5"
      >
        <div className="mb-1 flex items-center gap-2.5 border-b border-white/10 px-2 pb-2 pt-1">
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/15">
            {song.thumbnail && <img src={song.thumbnail} alt="" className="h-full w-full object-cover" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-white">{song.title}</p>
            <p className="truncate text-[10.5px] text-white/50">{song.artist}</p>
          </div>
        </div>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              closeContextMenu();
              void item.onClick();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
