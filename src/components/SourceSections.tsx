"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Play, ShieldCheck, Music4 } from "lucide-react";
import { api } from "@/lib/api";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { SongList } from "@/components/SongList";
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

/* ------------------------- NCS section ------------------------- */
export function NCSSection() {
  const [playlists, setPlaylists] = useState<NcsPlaylist[]>([]);
  const [tracks, setTracks] = useState<Song[]>([]);
  const playContext = usePlayer((s) => s.playContext);

  useEffect(() => {
    let alive = true;
    api<{ playlists: NcsPlaylist[] }>("/api/ncs/playlists")
      .then((d) => alive && setPlaylists((d.playlists || []).slice(0, 9)))
      .catch(() => undefined);
    api<{ results: Song[] }>("/api/ncs/search?q=best%20of&limit=8")
      .then((d) => {
        if (!alive) return;
        setTracks(d.results || []);
        warmList(d.results || [], 2);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle
        eyebrow="🎵 NoCopyrightSounds"
        title="NCS — Copyright Free Music"
        subtitle="100% free. No copyright. Stream, download and use in your own content — every track plays full-length through the Calamify proxy."
        action={
          <Link href="/ncs" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">
            All NCS <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {playlists.length === 0 && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 w-full" />)}
        {playlists.map((p, i) => (
          <motion.div key={`${p.id}-${i}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.04 }}>
            <Link href={`/ncs?playlist=${encodeURIComponent(p.id)}`} className="glass glass-card group relative block overflow-hidden p-4">
              <span className="absolute inset-0 opacity-35 transition group-hover:opacity-60" style={{ background: "linear-gradient(135deg,#22c55e,#00d4ff)" }} />
              <span className="relative block text-3xl">{p.icon}</span>
              <p className="relative mt-2 truncate font-display text-sm font-bold text-white">{p.name}</p>
              <p className="relative mt-1 line-clamp-2 text-[11px] text-white/60">{p.description}</p>
              <span className="glass-badge relative mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] text-emerald-200">
                <ShieldCheck className="h-3 w-3" /> Copyright Free
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {tracks.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <GlassBadge tone="cyan">Instant play</GlassBadge>
            <button onClick={() => playContext(tracks, 0)} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-4 py-2 text-xs font-semibold">
              <Play className="h-3.5 w-3.5 fill-white" /> Play NCS now
            </button>
          </div>
          <SongList songs={tracks} />
        </>
      )}
    </section>
  );
}

/* -------------------- Geometry Dash section -------------------- */
export function GeometryDashSection() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const playContext = usePlayer((s) => s.playContext);

  useEffect(() => {
    let alive = true;
    api<{ results: Song[] }>("/api/gd/songs?limit=34")
      .then((d) => {
        if (!alive) return;
        setSongs(d.results || []);
        warmList(d.results || [], 2);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle
        eyebrow="🎮 Geometry Dash soundtrack"
        title="Every Level. Every Banger."
        subtitle="The complete official Geometry Dash OST — ForeverBound, DJVI, Waterflame, DJ-Nate, F-777, Dex Arson and MDK. Free & legal, streaming full-length."
        action={
          <Link href="/geometry-dash" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">
            Full soundtrack <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="glass-strong relative overflow-hidden p-4 sm:p-6">
        <span className="animate-float absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-400/25 to-cyan-500/25 blur-3xl" />
        <div className="relative mb-4 flex flex-wrap items-center gap-2">
          <span className="glass-btn flex h-11 w-11 items-center justify-center rounded-xl !px-0 text-cyan-200">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-white">Main levels · {songs.length || 34} resolved streams</p>
            <p className="text-[11.5px] text-white/55">Creative Commons licensed audio from Newgrounds artists</p>
          </div>
          <button onClick={() => songs.length && playContext(songs, 0)} disabled={!songs.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
            <Play className="h-4 w-4 fill-white" /> Play soundtrack
          </button>
          <button
            onClick={() => {
              if (!songs.length) return;
              usePlayer.getState().setShuffle(true);
              playContext([...songs].sort(() => Math.random() - 0.5), 0);
            }}
            disabled={!songs.length}
            className="glass-btn !rounded-full px-5 py-2.5 text-sm disabled:opacity-40"
          >
            Shuffle
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-soft flex items-center gap-3 p-2.5">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/4" />
                  <div className="skeleton h-3 w-1/6" />
                </div>
              </div>
            ))}
          </div>
        ) : songs.length ? (
          <SongList songs={songs.slice(0, 12)} showAlbum={false} />
        ) : (
          <p className={cn("glass-soft p-6 text-center text-sm text-white/55")}>
            Resolving level themes… If nothing appears, open the <Link href="/geometry-dash" className="text-cyan-200 underline">full soundtrack page</Link>.
          </p>
        )}

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <GlassBadge tone="cyan">
            <ShieldCheck className="h-3 w-3" /> Creative Commons
          </GlassBadge>
          <GlassBadge tone="purple">
            <Music4 className="h-3 w-3" /> Full-length streams
          </GlassBadge>
          <Link href="/geometry-dash" className="ml-auto text-[11.5px] text-white/50 hover:text-cyan-200">
            See all levels →
          </Link>
        </div>
      </div>
    </section>
  );
}
