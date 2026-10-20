"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Mic2, X } from "lucide-react";
import { usePlayer } from "@/store/player";
import { LyricsDisplay } from "@/components/LyricsDisplay";

/**
 * Docked lyrics panel driven by the store's `lyricsOpen` flag, so the 🎤
 * button in the player bar (and the `Shift+L` shortcut) actually does
 * something without opening the full-screen Now Playing view.
 */
export function LyricsPanel() {
  const { lyricsOpen, expanded, current, setLyricsOpen, setExpanded } = usePlayer();
  const open = lyricsOpen && !expanded && Boolean(current);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLyricsOpen(false)}
            className="fixed inset-0 z-[62] bg-black/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-0"
          />
          <motion.aside
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-strong fixed inset-x-2 bottom-24 z-[63] max-h-[62vh] overflow-hidden p-3 sm:inset-x-auto sm:bottom-28 sm:right-6 sm:w-[380px]"
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <Mic2 className="h-4 w-4 text-cyan-200" />
              <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-white">
                {current?.title}
                <span className="ml-2 text-[11px] font-normal text-white/45">{current?.artist}</span>
              </p>
              <button
                onClick={() => {
                  setLyricsOpen(false);
                  setExpanded(true);
                }}
                aria-label="Open full screen player"
                title="Open full screen player"
                className="glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setLyricsOpen(false)} aria-label="Close lyrics" className="glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <LyricsDisplay compact />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
