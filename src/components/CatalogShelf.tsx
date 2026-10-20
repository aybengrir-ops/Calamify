"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Pause, Play, ShieldCheck, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { GlassBadge, SectionTitle } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { warmList } from "@/lib/preloader";
import { playHover } from "@/lib/soundEffects";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CatalogEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  cover: string;
}
interface CatalogSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  copyright: string;
  entries: CatalogEntry[];
}

/**
 * Compact shelf used "beside" other sections (e.g. under أناشيد): NCS-style
 * header, carousel of covers, play/shuffle, and a link to the full hub.
 */
export function CatalogShelf({ sectionId, hubHref, note }: { sectionId: string; hubHref: string; note?: string }) {
  const [section, setSection] = useState<CatalogSection | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { playContext, setShuffle, current, playing, toggle } = usePlayer();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    api<{ sections: CatalogSection[] }>("/api/catalog")
      .then((d) => alive && setSection((d.sections || []).find((s) => s.id === sectionId) || null))
      .catch(() => undefined);
    api<{ tracks: Song[] }>(`/api/catalog/${encodeURIComponent(sectionId)}?limit=24`)
      .then((d) => {
        if (!alive) return;
        setTracks(d.tracks || []);
        warmList(d.tracks || [], 2);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [sectionId]);

  const entries = useMemo(() => section?.entries || [], [section]);

  const songFor = (entry: CatalogEntry) =>
    tracks.find((t) => t.title.toLowerCase().includes(entry.title.toLowerCase().split(" ")[0])) as Song | undefined;

  const playEntry = async (entry: CatalogEntry) => {
    const song = songFor(entry);
    if (song) {
      playContext(tracks.length ? tracks : [song], Math.max(0, tracks.findIndex((s) => s.id === song.id)));
      return;
    }
    setBusyId(entry.id);
    try {
      const d = await api<{ resolved: boolean; song?: Song }>(`/api/catalog/resolve?id=${encodeURIComponent(entry.id)}`);
      if (d.resolved && d.song) playContext([d.song], 0);
      else if (typeof window !== "undefined") window.location.href = `/search?q=${encodeURIComponent(`${entry.title} ${entry.artist}`)}`;
    } catch {
      toast("Opening a live search for it instead", "info");
    } finally {
      setBusyId(null);
    }
  };

  if (!entries.length) return <section className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6"><div className="skeleton h-52 w-full" /></section>;

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-14 pt-4 sm:px-6">
      <div className="glass-strong relative overflow-hidden p-5 sm:p-7">
        <span className="absolute inset-0 opacity-40" style={{ background: section?.gradient }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/55 to-transparent" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="cyan">
                <ShieldCheck className="h-3 w-3" /> {section?.copyright}
              </GlassBadge>
              <GlassBadge tone="gold">Beside أناشيد</GlassBadge>
            </div>
            <h2 className="mt-2 flex items-center gap-2 font-display text-2xl font-bold text-white drop-shadow sm:text-4xl">
              <span className="text-3xl">{section?.icon}</span> {section?.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-white/70">
              {note || section?.subtitle} · {entries.length} tracks
              {tracks.length ? ` · ${tracks.length} streams ready` : " · resolving…"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => tracks.length && playContext(tracks, 0)} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold">
              <Play className="h-4 w-4 fill-white" /> Play all
            </button>
            <button
              onClick={() => {
                if (!tracks.length) return;
                setShuffle(true);
                playContext([...tracks].sort(() => Math.random() - 0.5), 0);
              }}
              className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <Link href={hubHref} className="glass-btn flex items-center gap-1.5 !rounded-full px-5 py-2.5 text-sm">
              Open hub <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <SectionTitle eyebrow={section?.title} title={`Every ${section?.title} track`} subtitle="Tap a cover — it streams full-length through the Calamify proxy" />
        <div className="no-scrollbar snap-x-mandatory flex gap-4 overflow-x-auto pb-3">
          {entries.map((entry, i) => {
            const song = songFor(entry);
            const active = Boolean(current) && current?.id === song?.id;
            return (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.4) }}
                onMouseEnter={playHover}
                onClick={() => (active && playing ? toggle() : void playEntry(entry))}
                className={cn("glass glass-card snap-start-item group relative w-[178px] shrink-0 overflow-hidden p-3 text-left sm:w-[196px]", active && "border-cyan-300/60 shadow-[0_0_28px_-12px_rgba(0,212,255,0.95)]")}
              >
                <span className="absolute inset-0 opacity-25 transition group-hover:opacity-45" style={{ background: section?.gradient }} />
                <span className="relative block aspect-square overflow-hidden rounded-2xl border border-white/12 bg-black/25">
                  {entry.cover ? (
                    <img src={entry.cover} alt={entry.title} loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/30 to-cyan-400/25 text-3xl">{section?.icon}</span>
                  )}
                  <span className={cn("absolute inset-0 flex items-center justify-center transition duration-300", active ? "bg-cyan-400/20 opacity-100" : "bg-black/45 opacity-0 group-hover:opacity-100")}>
                    {busyId === entry.id ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : active && playing ? (
                      <Pause className="h-6 w-6 fill-white text-white" />
                    ) : (
                      <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                    )}
                  </span>
                  {song && <span className="glass-badge absolute right-2 top-2 px-1.5 py-[1px] text-[8.5px] text-emerald-200">✓ ready</span>}
                </span>
                <span className="relative mt-3 block overflow-hidden">
                  <span className={cn("block truncate text-[13px] font-semibold", active ? "text-cyan-200" : "text-white")}>{entry.title}</span>
                  <span className="block truncate text-[11px] text-white/50">{entry.artist}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/60">{entry.genre}</span>
                    <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/40">{entry.year}</span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
