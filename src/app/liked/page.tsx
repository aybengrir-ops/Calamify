"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Play, Search, Shuffle } from "lucide-react";
import { SongList } from "@/components/SongList";
import { GlassBadge } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { formatTotalDuration, type Song } from "@/lib/types";
import { cn } from "@/lib/cn";

type SortKey = "recent" | "title" | "artist" | "duration";

export default function LikedPage() {
  const { likedSongs, user } = useSession();
  const { playContext, setShuffle } = usePlayer();
  const { setAuthOpen } = useUi();
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState("");
  const [genre, setGenre] = useState("all");

  const genres = useMemo(() => [...new Set(likedSongs.map((s) => s.genre).filter(Boolean))] as string[], [likedSongs]);

  const list: Song[] = useMemo(() => {
    let out = [...likedSongs];
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      out = out.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    if (genre !== "all") out = out.filter((s) => (s.genre || "") === genre);
    if (sort === "title") out.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "artist") out.sort((a, b) => a.artist.localeCompare(b.artist));
    if (sort === "duration") out.sort((a, b) => b.duration - a.duration);
    return out;
  }, [likedSongs, sort, filter, genre]);

  const total = list.reduce((a, b) => a + (b.duration || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="absolute inset-0 opacity-45" style={{ background: "linear-gradient(135deg,#ff2e97,#7b2ff7)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/60 to-transparent" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <GlassBadge tone="pink">♥ Collection</GlassBadge>
            <h1 className="mt-2 flex items-center gap-3 font-display text-4xl font-bold text-white drop-shadow sm:text-5xl">
              <Heart className="h-9 w-9 fill-pink-400 text-pink-300" /> Liked Songs
            </h1>
            <p className="mt-2 text-sm text-white/75">
              {likedSongs.length} liked songs · {formatTotalDuration(total)} · {user ? `owned by ${user.displayName}` : "stored on this device"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => playContext(list, 0)} disabled={!list.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
              <Play className="h-4 w-4 fill-white" /> Play all
            </button>
            <button
              onClick={() => {
                setShuffle(true);
                playContext([...list].sort(() => Math.random() - 0.5), 0);
              }}
              disabled={!list.length}
              className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            {!user && <button onClick={() => setAuthOpen(true, "signup")} className="glass-btn !rounded-full px-5 py-2.5 text-sm">Sign in to sync</button>}
          </div>
        </div>
      </motion.header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search within liked songs…" className="glass-input w-full py-2.5 pl-10 text-sm" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort liked songs" className="glass-input !rounded-2xl px-3 py-2.5 text-xs">
          <option value="recent">Sort: Date liked</option>
          <option value="title">Sort: Title</option>
          <option value="artist">Sort: Artist</option>
          <option value="duration">Sort: Duration</option>
        </select>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter genre" className="glass-input !rounded-2xl px-3 py-2.5 text-xs">
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="glass-soft flex flex-col items-center gap-3 p-12 text-center">
          <span className="text-4xl">💜</span>
          <p className="max-w-md text-sm text-white/60">
            {likedSongs.length === 0 ? "No liked songs yet. Tap the heart on any track — it fills, glows and lands right here." : "Nothing matches that filter."}
          </p>
          {likedSongs.length === 0 && (
            <Link href="/trending" className={cn("glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm")}>Browse trending</Link>
          )}
        </div>
      ) : (
        <SongList songs={list} numbered={false} />
      )}
    </div>
  );
}
