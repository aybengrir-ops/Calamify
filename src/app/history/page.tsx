"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { History, Play, Trash2 } from "lucide-react";
import { SongList } from "@/components/SongList";
import { GlassBadge } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { formatDuration } from "@/lib/types";

export default function HistoryPage() {
  const { history, clearHistory } = useSession();
  const playContext = usePlayer((s) => s.playContext);
  const { toast } = useUi();
  const [confirm, setConfirm] = useState(false);

  const grouped = history.reduce<Record<string, { song: typeof history[number]["song"]; playedAt: string }[]>>((acc, item) => {
    const day = new Date(item.playedAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
    (acc[day] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        <span className="animate-float absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-600/25 blur-3xl" />
        <GlassBadge tone="cyan">Auto-tracked</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
          <History className="h-7 w-7 text-cyan-200" /> Recently played
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/60">
          The last {history.length || 100} tracks you listened to, in chronological order. Replay anything instantly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => history.length && playContext(history.map((h) => h.song), 0)} disabled={!history.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm disabled:opacity-40">
            <Play className="h-4 w-4 fill-white" /> Replay session
          </button>
          <button
            onClick={() => {
              if (confirm) {
                void clearHistory();
                setConfirm(false);
                toast("History cleared", "info");
              } else setConfirm(true);
            }}
            onBlur={() => setConfirm(false)}
            className={`glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm ${confirm ? "border-pink-300/70 text-pink-200" : ""}`}
          >
            <Trash2 className="h-4 w-4" /> {confirm ? "Tap again to confirm" : "Clear history"}
          </button>
        </div>
      </motion.header>

      {history.length === 0 ? (
        <div className="glass-soft p-12 text-center">
          <p className="text-4xl">🛰️</p>
          <p className="mt-3 text-sm text-white/55">No plays logged yet. Press play anywhere in the app and your history starts here.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, items]) => (
          <section key={day}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-cyan-200/80">{day}</h2>
              <span className="divider-planet flex-1" />
              <span className="text-[11px] text-white/35">{formatDuration(items.reduce((a, b) => a + (b.song.duration || 0), 0))} of audio</span>
            </div>
            <SongList songs={items.map((i) => i.song)} numbered={false} />
          </section>
        ))
      )}
    </div>
  );
}
