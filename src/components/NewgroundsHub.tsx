"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Music4, Play, Search, ShieldCheck, Shuffle, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { SongList, SongRow } from "@/components/SongList";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { warmList } from "@/lib/preloader";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface NgGenre {
  key: string;
  name: string;
  icon: string;
}
interface NgPlaylist {
  id: string;
  name: string;
  description: string;
  icon: string;
  from: string;
  to: string;
  trackCount: number | null;
}

/**
 * Newgrounds Universe hub — genres, featured collections, charts and tracks.
 * Every row is playable: real Newgrounds streams when the portal answers us,
 * resolved full-length mirrors when it refuses datacenter traffic.
 */
export function NewgroundsHub({ variant = "section", initialPlaylist }: { variant?: "section" | "page"; initialPlaylist?: string }) {
  const [genres, setGenres] = useState<NgGenre[]>([]);
  const [featured, setFeatured] = useState<NgPlaylist[]>([]);
  const [charts, setCharts] = useState<Song[]>([]);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [heading, setHeading] = useState("Featured playlists");
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(initialPlaylist || null);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "alltime">("weekly");
  const [query, setQuery] = useState("");
  const [reachable, setReachable] = useState<boolean | null>(null);
  const playContext = usePlayer((s) => s.playContext);
  const setShuffle = usePlayer((s) => s.setShuffle);

  useEffect(() => {
    let alive = true;
    api<{ genres: NgGenre[]; reachable: boolean }>("/api/ng/genres")
      .then((d) => alive && (setGenres(d.genres || []), setReachable(d.reachable)))
      .catch(() => undefined);
    api<{ playlists: NgPlaylist[] }>("/api/ng/featured")
      .then((d) => alive && setFeatured(d.playlists || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    api<{ tracks: Song[]; reachable: boolean }>(`/api/ng/charts?period=${period}`)
      .then((d) => {
        if (!alive) return;
        setCharts(d.tracks || []);
        setReachable(d.reachable);
        warmList(d.tracks || [], 2);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [period]);

  useEffect(() => {
    if (!initialPlaylist) return;
    void loadPlaylist(initialPlaylist);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlaylist]);

  const loadPlaylist = async (id: string) => {
    setLoading(true);
    setActivePlaylist(id);
    setActiveGenre(null);
    try {
      const d = await api<{ name: string; tracks: Song[]; reachable: boolean }>(`/api/ng/featured/${encodeURIComponent(id)}`);
      setTracks(d.tracks || []);
      setHeading(d.name);
      setReachable(d.reachable);
      warmList(d.tracks || [], 3);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGenre = async (key: string, name: string) => {
    setLoading(true);
    setActiveGenre(key);
    setActivePlaylist(null);
    try {
      const d = await api<{ tracks: Song[]; reachable: boolean }>(`/api/ng/genre/${encodeURIComponent(key)}?sort=score`);
      setTracks(d.tracks || []);
      setHeading(`${name} · Newgrounds`);
      setReachable(d.reachable);
      warmList(d.tracks || [], 3);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (value: string) => {
    setLoading(true);
    setActiveGenre(null);
    setActivePlaylist(null);
    try {
      const d = await api<{ results: Song[]; reachable: boolean }>(`/api/ng/search?q=${encodeURIComponent(value)}&limit=30`);
      setTracks(d.results || []);
      setHeading(`Newgrounds results for “${value}”`);
      setReachable(d.reachable);
      warmList(d.results || [], 3);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn("mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6", variant === "page" && "pt-8")}>
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        <span className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg,#ff8a00,#7b2ff7,#00d4ff)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/65 to-transparent" />
        <span className="animate-float absolute -right-12 -top-14 h-52 w-52 rounded-full bg-gradient-to-br from-amber-400/30 to-fuchsia-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GlassBadge tone="gold">
              <ShieldCheck className="h-3 w-3" /> 100% Free
            </GlassBadge>
            <GlassBadge tone="cyan">Copyright free</GlassBadge>
            <GlassBadge tone="purple">2M+ tracks</GlassBadge>
            {reachable === false && (
              <GlassBadge tone="pink">
                <TriangleAlert className="h-3 w-3" /> NG Guard blocked · mirrors live
              </GlassBadge>
            )}
            {reachable === true && <GlassBadge tone="cyan">● Newgrounds portal live</GlassBadge>}
          </div>
          <h2 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">
            <Music4 className="h-8 w-8 text-amber-200" /> <span className="text-gradient">Newgrounds Universe</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Millions of copyright-free tracks from independent artists on the Newgrounds Audio Portal — 32 genres, weekly charts and 13 hand-picked collections.
            Streams run full-length through the Calamify proxy with seek support.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {variant === "page" && (
              <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && query.trim() && runSearch(query.trim())}
                  placeholder="Search 2M+ Newgrounds tracks…"
                  className="glass-input w-full py-2.5 pl-10 text-sm"
                />
              </div>
            )}
            <button onClick={() => tracks.length && playContext(tracks, 0)} disabled={!tracks.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
              <Play className="h-4 w-4 fill-white" /> Play selection
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
            {variant === "section" && (
              <Link href="/newgrounds" className="glass-btn flex items-center gap-1.5 !rounded-full px-5 py-2.5 text-sm">
                Open the hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* featured playlists */}
      <div className="mt-10">
        <SectionTitle eyebrow="🌟 Hand-picked" title="Featured Playlists" subtitle="Thirteen collections, including every Geometry Dash classic" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {featured.length === 0 && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-32 w-full" />)}
          {featured.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 10) * 0.03 }}
              onClick={() => void loadPlaylist(p.id)}
              className={cn("glass glass-card group relative overflow-hidden p-4 text-left", activePlaylist === p.id && "border-amber-300/60 shadow-[0_0_28px_-10px_rgba(255,215,0,0.9)]")}
            >
              <span className="absolute inset-0 opacity-40 transition group-hover:opacity-65" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
              <span className="relative block text-2xl">{p.icon}</span>
              <p className="relative mt-2 truncate font-display text-[13px] font-bold text-white">{p.name}</p>
              <p className="relative mt-1 line-clamp-2 text-[10.5px] leading-snug text-white/60">{p.description}</p>
              <span className="glass-badge relative mt-2 inline-block px-2 py-0.5 text-[9px] text-emerald-200">✓ {p.trackCount ? `${p.trackCount} tracks` : "live feed"}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* genres */}
      <div className="mt-10">
        <SectionTitle eyebrow="🎼 Audio Portal" title="Browse by Genre" subtitle="Dubstep, house, trance, chiptune, VGM, metal, hip hop and 25 more" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {genres.map((gen, i) => (
            <motion.button
              key={gen.key}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: (i % 16) * 0.02 }}
              onClick={() => void loadGenre(gen.key, gen.name)}
              className={cn(
                "glass glass-card flex flex-col items-center gap-1.5 p-3 text-center",
                activeGenre === gen.key && "border-cyan-300/60 shadow-[0_0_24px_-10px_rgba(0,212,255,0.9)]"
              )}
            >
              <span className="text-xl">{gen.icon}</span>
              <span className="truncate text-[11px] font-semibold text-white/85">{gen.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* charts */}
      <div className="mt-10">
        <SectionTitle
          eyebrow="📊 Audio Portal charts"
          title={`Top tracks · ${period}`}
          action={
            <div className="flex gap-1.5">
              {(["weekly", "monthly", "alltime"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={cn("glass-btn !rounded-full px-3.5 py-1.5 text-[11px] capitalize", period === p && "glass-btn-primary font-semibold")}>
                  {p === "alltime" ? "all-time" : p}
                </button>
              ))}
            </div>
          }
        />
        {charts.length ? (
          <div className="space-y-2">
            {charts.slice(0, 10).map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-3">
                <span className="w-7 shrink-0 text-center font-display text-sm font-bold text-white/35">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <SongRow song={t} context={charts} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SongRowSkeleton rows={4} />
        )}
      </div>

      {/* selected tracks */}
      <div className="mt-10">
        <SectionTitle
          eyebrow={activePlaylist ? "Collection" : activeGenre ? "Genre" : "Selection"}
          title={heading}
          subtitle={tracks.length ? `${tracks.length} tracks · ${Math.round(tracks.reduce((a, b) => a + (b.duration || 0), 0) / 60)} min` : "Pick a playlist or genre above"}
        />
        {loading ? <SongRowSkeleton rows={6} /> : tracks.length ? <SongList songs={tracks} showAlbum={false} /> : <p className="glass-soft p-8 text-center text-sm text-white/50">Nothing selected yet.</p>}
      </div>
    </section>
  );
}
