"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { GripVertical, ListMusic, Trash2, X } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { formatDuration } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Slide-in queue with drag & drop reordering. */
export function QueuePanel() {
  const { queue, index, current, jumpTo, removeFromQueue, moveInQueue, clearQueue, setQueueOpen } = usePlayer();
  const { toast } = useUi();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const upcoming = queue.map((s, i) => ({ song: s, i })).filter(({ i }) => i !== index);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQueueOpen(false)} className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="glass-strong fixed right-0 top-0 z-[66] flex h-full w-full max-w-sm flex-col gap-3 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <ListMusic className="h-5 w-5 text-cyan-200" /> Queue
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearQueue();
                toast("Queue cleared", "info");
              }}
              className="glass-btn flex items-center gap-1.5 !rounded-lg px-2.5 py-1.5 text-[11px]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
            <button onClick={() => setQueueOpen(false)} aria-label="Close queue" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {current && (
          <div className="glass-soft flex items-center gap-3 p-2.5">
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/15">
              {current.thumbnail && <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">Playing now</p>
              <p className="truncate text-[13px] font-medium text-white">{current.title}</p>
              <p className="truncate text-[11px] text-white/50">{current.artist}</p>
            </div>
          </div>
        )}

        <div className="no-scrollbar -mr-2 flex-1 space-y-1 overflow-y-auto pr-2">
          {upcoming.length === 0 && <p className="py-10 text-center text-sm text-white/40">Queue is empty. Add songs from any “…” menu.</p>}
          {upcoming.map(({ song, i }) => (
            <div
              key={`${song.id}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) moveInQueue(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                "group flex items-center gap-2 rounded-xl border border-transparent p-2 transition hover:border-white/15 hover:bg-white/10",
                overIndex === i && dragIndex !== null && "border-cyan-300/60 bg-cyan-400/10",
                dragIndex === i && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-white/25 group-hover:text-white/60" />
              <button onClick={() => jumpTo(i)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                  {song.thumbnail && <img src={song.thumbnail} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] text-white/85">{song.title}</span>
                  <span className="block truncate text-[10.5px] text-white/45">{song.artist}</span>
                </span>
              </button>
              <span className="text-[10px] tabular-nums text-white/35">{formatDuration(song.duration)}</span>
              <button
                onClick={() => removeFromQueue(i)}
                aria-label="Remove from queue"
                className="rounded-full p-1 text-white/30 opacity-0 transition hover:text-pink-300 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.aside>
    </>
  );
}
