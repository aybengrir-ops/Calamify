"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, HardDrive, Pause, Play, Search, Trash2, WifiOff } from "lucide-react";
import { GlassBadge, GlassButton, SectionTitle } from "@/components/ui/Glass";
import { useOffline } from "@/store/offline";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { formatBytes } from "@/lib/offlineDb";
import { formatDuration, formatTotalDuration, type Song } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * 📥 Offline library — everything stored in this device's IndexedDB
 * (`calamify_offline_tracks`). Plays with zero network.
 */
export default function DownloadsPage() {
  const { tracks, bytes, quota, usage, online, ready, remove, clearAll, refresh } = useOffline();
  const { playContext, current, playing, toggle } = usePlayer();
  const { toast } = useUi();
  const [confirmClear, setConfirmClear] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const asSongs = (list: typeof tracks): Song[] =>
    list.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      thumbnail: t.artwork,
      source: (t.source as Song["source"]) || "audius",
      genre: t.genre,
      album: t.album,
    }));

  const filtered = query.trim()
    ? tracks.filter((t) => {
        const q = query.trim().toLowerCase();
        return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
      })
    : tracks;

  const songs = asSongs(filtered);
  const totalSeconds = tracks.reduce((a, b) => a + (b.duration || 0), 0);
  const pctOfQuota = quota ? Math.min(100, (usage / quota) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        <span className="animate-float absolute -left-10 -bottom-12 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/25 to-cyan-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GlassBadge tone="cyan">IndexedDB · calamify_offline_tracks</GlassBadge>
            <span className={cn("glass-badge px-3 py-1.5", online ? "text-emerald-200" : "text-amber-200")}>{online ? "● Online" : "○ Offline mode"}</span>
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
            <Download className="h-7 w-7 text-emerald-200" /> Downloads
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Full tracks stored on this device — artwork, metadata, lyrics and the complete audio blob. They play instantly with no connection at all.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Stored audio", value: formatBytes(bytes), icon: <HardDrive className="h-4 w-4 text-cyan-200" /> },
              { label: "Tracks", value: String(tracks.length), icon: <Download className="h-4 w-4 text-emerald-200" /> },
              { label: "Play time", value: formatTotalDuration(totalSeconds), icon: <Play className="h-4 w-4 text-violet-200" /> },
              { label: "Device quota", value: quota ? `${pctOfQuota.toFixed(0)}% of ${formatBytes(quota)}` : "n/a", icon: <HardDrive className="h-4 w-4 text-amber-200" /> },
            ].map((m) => (
              <div key={m.label} className="glass-soft p-3">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {m.icon} {m.label}
                </span>
                <p className="mt-1 font-display text-lg font-bold text-white">{ready ? m.value : "—"}</p>
              </div>
            ))}
          </div>

          {quota > 0 && (
            <div className="mt-3">
              <div className="progress-track h-1.5">
                <div className="progress-fill" style={{ width: `${pctOfQuota}%` }} />
              </div>
              <p className="mt-1 text-[10.5px] text-white/35">
                {formatBytes(usage)} used of {formatBytes(quota)} available in this browser origin
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <GlassButton variant="primary" disabled={!songs.length} onClick={() => playContext(songs, 0)} icon={<Play className="h-4 w-4 fill-white" />}>
              Play offline library
            </GlassButton>
            <GlassButton
              disabled={!songs.length}
              onClick={() => {
                usePlayer.getState().setShuffle(true);
                playContext([...songs].sort(() => Math.random() - 0.5), 0);
              }}
            >
              Shuffle
            </GlassButton>
            <GlassButton
              variant="danger"
              disabled={!tracks.length}
              onClick={async () => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  window.setTimeout(() => setConfirmClear(false), 4000);
                  return;
                }
                await clearAll();
                setConfirmClear(false);
              }}
              icon={<Trash2 className="h-4 w-4" />}
            >
              {confirmClear ? "Tap again to confirm" : "Clear all"}
            </GlassButton>
            <Link href="/trending" className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2.5 text-sm">
              <Search className="h-4 w-4" /> Find more to save
            </Link>
          </div>
        </div>
      </motion.header>

      {tracks.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your downloads…" className="glass-input w-full py-2.5 pl-10 text-sm" />
        </div>
      )}

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass-soft flex flex-col items-center gap-3 p-12 text-center">
          <WifiOff className="h-8 w-8 text-white/40" />
          <p className="max-w-md text-sm text-white/60">
            Nothing downloaded yet. Tap the <Download className="inline h-3.5 w-3.5 text-cyan-200" /> button on any track card, in the player bar, or in a song&apos;s “…” menu — the
            whole file is stored locally and plays with no connection.
          </p>
          <Link href="/trending" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Browse trending</Link>
        </div>
      ) : (
        <section>
          <SectionTitle eyebrow="On this device" title={`${filtered.length} downloaded track${filtered.length === 1 ? "" : "s"}`} subtitle={`${formatBytes(bytes)} of audio · plays without a network`} />
          <div className="space-y-2">
            {tracks.length && songs.map((song, i) => {
              const meta = filtered[i];
              const isCurrent = current?.id === song.id;
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                  className={cn("glass-soft group flex items-center gap-3 p-2.5 transition hover:border-cyan-300/40 hover:bg-white/10", isCurrent && "border-cyan-300/50 bg-cyan-400/10")}
                >
                  <button onClick={() => (isCurrent ? toggle() : playContext(songs, i))} aria-label={isCurrent && playing ? "Pause" : "Play offline"} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-gradient-to-br from-violet-700/40 to-cyan-500/30">
                    {song.thumbnail ? <img src={song.thumbnail} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-lg">🎵</span>}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                      {isCurrent && playing ? <Pause className="h-4 w-4 fill-white" /> : <Play className="ml-0.5 h-4 w-4 fill-white" />}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[13px] font-medium", isCurrent ? "text-cyan-200" : "text-white")}>{song.title}</p>
                    <p className="truncate text-[11.5px] text-white/50">{song.artist}</p>
                  </div>
                  <span className="glass-badge hidden px-2 py-0.5 text-[9px] text-emerald-200 sm:inline-flex">✓ offline</span>
                  <span className="hidden w-20 text-right text-[11px] tabular-nums text-white/40 sm:block">{formatBytes(meta?.bytes || 0)}</span>
                  <span className="w-12 text-right text-[11px] tabular-nums text-white/40">{formatDuration(song.duration)}</span>
                  <button
                    onClick={() => void remove(song.id)}
                    aria-label={`Delete ${song.title} from downloads`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-pink-500/15 hover:text-pink-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[11px] text-white/35" onMouseDown={() => toast("Downloads live in this browser profile only", "info")}>
            Stored in IndexedDB on this device · audio never leaves your phone or laptop
          </p>
        </section>
      )}
    </div>
  );
}
