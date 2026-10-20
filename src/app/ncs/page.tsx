"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Music4, Play, Search, ShieldCheck, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { SongList } from "@/components/SongList";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { warmList } from "@/lib/preloader";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface NcsPlaylist {
  id: string;
  name: string;
  icon: string;
  description: string;
}

function NcsClient() {
  const params = useSearchParams();
  const initialPlaylist = params.get("playlist") || "";
  const [playlists, setPlaylists] = useState<NcsPlaylist[]>([]);
  const [active, setActive] = useState<string>(initialPlaylist);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const playContext = usePlayer((s) => s.playContext);
  const setShuffle = usePlayer((s) => s.setShuffle);

  useEffect(() => {
    let alive = true;
    api<{ playlists: NcsPlaylist[] }>("/api/ncs/playlists")
      .then((d) => {
        if (!alive) return;
        const list = d.playlists || [];
        setPlaylists(list);
        if (!active && list[0]) setActive(list[0].id);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const endpoint = active ? `/api/ncs/playlist/${encodeURIComponent(active)}` : `/api/ncs/search?q=${encodeURIComponent(query || "best of")}&limit=40`;
    api<any>(endpoint)
      .then((d) => {
        if (!alive) return;
        const list: Song[] = d.tracks || d.results || [];
        setTracks(list);
        warmList(list, 3);
      })
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [active, query]);

  const total = tracks.reduce((a, b) => a + (b.duration || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="absolute inset-0 opacity-45" style={{ background: "linear-gradient(135deg,#22c55e,#00d4ff)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/60 to-transparent" />
        <div className="relative">
          <GlassBadge tone="cyan">
            <ShieldCheck className="h-3 w-3" /> Copyright free
          </GlassBadge>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">
            <Music4 className="h-8 w-8 text-emerald-200" /> NoCopyrightSounds
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">
            Thousands of electronic, dubstep, house, trap and drum &amp; bass tracks released by NCS — free for creators and free for you. Every track streams
            full-length through the Calamify audio proxy.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => tracks.length && playContext(tracks, 0)} disabled={!tracks.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
              <Play className="h-4 w-4 fill-white" /> Play all
            </button>
            <button
              onClick={() => {
                if (!tracks.length) return;
                setShuffle(true);
                playContext([...tracks].sort(() => Math.random() - 0.5), 0);
              }}
              disabled={!tracks.length}
              className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive("");
                }}
                placeholder="Search NCS (artist, mood, genre)…"
                className="glass-input w-full py-2.5 pl-10 text-sm"
              />
            </div>
            <Link href="/geometry-dash" className="glass-btn !rounded-full px-4 py-2.5 text-xs">🎮 GD soundtrack</Link>
          </div>
        </div>
      </motion.header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {playlists.map((p) => (
          <button key={p.id} onClick={() => { setActive(p.id); setQuery(""); }} className={cn("glass-btn flex shrink-0 items-center gap-2 !rounded-full px-4 py-2 text-xs", active === p.id && "glass-btn-primary font-semibold")}>
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      <section>
        <SectionTitle
          eyebrow={active ? playlists.find((p) => p.id === active)?.name : "NCS search"}
          title={query ? `NCS results for “${query}”` : "Tracks"}
          subtitle={tracks.length ? `${tracks.length} tracks · ${Math.round(total / 60)} min of copyright-free audio` : undefined}
        />
        {loading ? <SongRowSkeleton rows={8} /> : tracks.length ? <SongList songs={tracks} showAlbum={false} /> : <p className="glass-soft p-8 text-center text-sm text-white/55">No NCS tracks matched. Try another keyword.</p>}
      </section>
    </div>
  );
}

export default function NcsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1500px] px-6 pt-10"><div className="skeleton h-56 w-full" /></div>}>
      <NcsClient />
    </Suspense>
  );
}
