"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid2x2, Pause, Play, Rows3, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { warmList } from "@/lib/preloader";
import { GlassBadge } from "@/components/ui/Glass";
import { playSwoosh, playHover } from "@/lib/soundEffects";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CatalogEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  ytQuery: string;
  cover: string;
}
interface CatalogSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  copyright: string;
  /** labelled sub-groups (Geometry Dash OST: main / meltdown / demons) */
  subGroups?: { label: string; entryIds: string[] }[];
  entries: CatalogEntry[];
}

const COLLAPSED_COUNT = 10;

/**
 * Home shelves for the curated copyright-free catalogue (NCS classics, NEFFEX,
 * Kevin MacLeod, Geometry Dash, Phonk, Anime Lofi).
 *
 * Cards paint instantly from static metadata; each shelf resolves its real
 * full-length streams when it scrolls into view. "Show All" swaps the carousel
 * for a responsive grid.
 */
export function MusicSections() {
  const [sections, setSections] = useState<CatalogSection[]>([]);
  const [resolved, setResolved] = useState<Record<string, Song[]>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { playContext, current, playing, toggle } = usePlayer();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    api<{ sections: CatalogSection[] }>("/api/catalog")
      .then((d) => alive && setSections(d.sections || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const loadSection = async (sectionId: string) => {
    if (resolved[sectionId] || busy[sectionId]) return;
    setBusy((b) => ({ ...b, [sectionId]: true }));
    try {
      const d = await api<{ tracks: Song[] }>(`/api/catalog/${encodeURIComponent(sectionId)}?limit=40`);
      const tracks = d.tracks || [];
      setResolved((r) => ({ ...r, [sectionId]: tracks }));
      warmList(tracks, 2);
    } catch {
      setResolved((r) => ({ ...r, [sectionId]: [] }));
    } finally {
      setBusy((b) => ({ ...b, [sectionId]: false }));
    }
  };

  const playEntry = async (section: CatalogSection, entry: CatalogEntry, index: number) => {
    const tracks = resolved[section.id];
    if (tracks && tracks.length) {
      const matchIndex = tracks.findIndex((t) => t.title.toLowerCase().includes(entry.title.toLowerCase().split(" ")[0]));
      playContext(tracks, matchIndex >= 0 ? matchIndex : Math.min(index, tracks.length - 1));
      return;
    }
    setLoadingId(entry.id);
    try {
      const d = await api<{ resolved: boolean; song?: Song }>(`/api/catalog/resolve?id=${encodeURIComponent(entry.id)}`);
      if (d.resolved && d.song) {
        playContext([d.song], 0);
        void loadSection(section.id);
        return;
      }
      toast(`Could not resolve “${entry.title}” right now`, "error");
    } catch {
      toast(`Could not resolve “${entry.title}” right now`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  if (!sections.length) {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-10 px-4 py-12 sm:px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-6 w-64" />
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="skeleton h-56 w-[186px] shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 py-4">
      {sections.map((section) => (
        <Shelf
          key={section.id}
          section={section}
          tracks={resolved[section.id]}
          busy={Boolean(busy[section.id])}
          loadingId={loadingId}
          current={current}
          playing={playing}
          onEnter={() => void loadSection(section.id)}
          onPlay={(entry, index) => void playEntry(section, entry, index)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

function Shelf({
  section,
  tracks,
  busy,
  loadingId,
  current,
  playing,
  onEnter,
  onPlay,
  onToggle,
}: {
  section: CatalogSection;
  tracks?: Song[];
  busy: boolean;
  loadingId: string | null;
  current: Song | null;
  playing: boolean;
  onEnter: () => void;
  onPlay: (entry: CatalogEntry, index: number) => void;
  onToggle: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const seen = useRef(false);

  const check = () => {
    const el = scrollRef.current;
    if (!el) return;
    setLeft(el.scrollLeft > 6);
    setRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [tracks, showAll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || seen.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !seen.current) {
          seen.current = true;
          onEnter();
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nudge = (dir: number) => {
    playSwoosh();
    scrollRef.current?.scrollBy({ left: dir * 620, behavior: "smooth" });
  };

  const visible = showAll ? section.entries : section.entries.slice(0, COLLAPSED_COUNT);
  const badgeFor = (entryId: string) => section.subGroups?.find((g) => g.entryIds.includes(entryId))?.label || "";
  const isActiveEntry = (entry: CatalogEntry) => {
    if (!current) return false;
    const resolvedSong = tracks?.find((t) => t.title.toLowerCase().includes(entry.title.toLowerCase().split(" ")[0]));
    if (resolvedSong && current.id === resolvedSong.id) return true;
    return current.title?.toLowerCase().includes(entry.title.toLowerCase()) && current.artist?.toLowerCase().includes(entry.artist.toLowerCase().split(" feat")[0]);
  };

  const cardFor = (entry: CatalogEntry, i: number) => {
    const active = isActiveEntry(entry);
    return (
      <Card
        key={entry.id}
        entry={entry}
        index={i}
        gradient={section.gradient}
        icon={section.icon}
        badge={badgeFor(entry.id)}
        active={active}
        playing={playing}
        loading={loadingId === entry.id}
        resolved={Boolean(tracks?.some((t) => t.title.toLowerCase().includes(entry.title.toLowerCase().split(" ")[0])))}
        grid={showAll}
        onPlay={() => (active && playing ? onToggle() : onPlay(entry, i))}
      />
    );
  };
  const cards = visible.map(cardFor);

  // Sub-grouped shelves (Geometry Dash OST) render labelled blocks in grid mode.
  const groupedBlocks =
    showAll && section.subGroups?.length
      ? section.subGroups
          .map((group) => ({ group, entries: group.entryIds.map((id) => section.entries.find((e) => e.id === id)).filter(Boolean) as CatalogEntry[] }))
          .filter((b) => b.entries.length)
      : null;

  return (
    <section className="relative mx-auto w-full max-w-[1500px] px-4 sm:px-6">
      <div>
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-gradient font-display text-xl font-bold sm:text-2xl">
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </h2>
                <GlassBadge tone="cyan">
                  <ShieldCheck className="h-3 w-3" /> {section.copyright}
                </GlassBadge>
              </div>
              <p className="mt-1 text-[12.5px] text-white/50">
                {section.subtitle} · {section.entries.length} tracks
                {tracks ? ` · ${tracks.length} streams ready` : busy ? " · resolving streams…" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {section.entries.length > COLLAPSED_COUNT && (
                <button
                  onClick={() => {
                    playSwoosh();
                    setShowAll((v) => !v);
                  }}
                  className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-[11.5px] font-medium text-cyan-200"
                >
                  {showAll ? <Rows3 className="h-3.5 w-3.5" /> : <Grid2x2 className="h-3.5 w-3.5" />}
                  {showAll ? "Show less" : `Show all (${section.entries.length})`}
                </button>
              )}
              {!showAll && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => nudge(-1)} disabled={!left} aria-label="Scroll left" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0 disabled:opacity-25">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => nudge(1)} disabled={!right} aria-label="Scroll right" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0 disabled:opacity-25">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {groupedBlocks ? (
            <div className="space-y-6">
              {groupedBlocks.map(({ group, entries }) => (
                <div key={group.label}>
                  <div className="mb-2.5 flex items-center gap-3">
                    <h3 className="font-display text-[12.5px] font-bold uppercase tracking-[0.2em] text-cyan-200/85">{group.label}</h3>
                    <span className="text-[11px] text-white/35">{entries.length} tracks</span>
                    <span className="divider-planet flex-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                    {entries.map((entry) => cardFor(entry, section.entries.indexOf(entry)))}
                  </div>
                </div>
              ))}
            </div>
          ) : showAll ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{cards}</div>
          ) : (
            <div ref={scrollRef} className="no-scrollbar snap-x-mandatory flex gap-4 overflow-x-auto pb-3">
              {cards}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Card({
  entry,
  index,
  gradient,
  icon,
  badge,
  active,
  playing,
  loading,
  resolved,
  grid,
  onPlay,
}: {
  entry: CatalogEntry;
  index: number;
  gradient: string;
  icon: string;
  badge?: string;
  active: boolean;
  playing: boolean;
  loading: boolean;
  resolved: boolean;
  grid: boolean;
  onPlay: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.35) }}
      onMouseEnter={playHover}
      onClick={onPlay}
      className={cn(
        "glass glass-card group relative shrink-0 overflow-hidden p-3 text-left",
        grid ? "w-full" : "snap-start-item w-[178px] sm:w-[196px]",
        active && "border-cyan-300/60 bg-cyan-400/[0.07] shadow-[0_0_30px_-12px_rgba(0,212,255,0.95)]"
      )}
    >
      <span className="absolute inset-0 opacity-25 transition group-hover:opacity-45" style={{ background: gradient }} />
      <span className="relative block aspect-square overflow-hidden rounded-2xl border border-white/12 bg-black/25">
        {entry.cover ? (
          <img
            src={entry.cover}
            alt={entry.title}
            loading="lazy"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/30 to-cyan-400/25 text-3xl">{icon}</span>
        )}
        <span className={cn("absolute inset-0 flex items-center justify-center transition duration-300", active ? "bg-cyan-400/20 opacity-100" : "bg-black/45 opacity-0 group-hover:opacity-100")}>
          {loading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : active && playing ? (
            <Pause className="h-6 w-6 fill-white text-white" />
          ) : (
            <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
          )}
        </span>
        {active && playing && (
          <span className="eq-bars">
            <span />
            <span />
            <span />
            <span />
          </span>
        )}
        {resolved && <span className="glass-badge absolute right-2 top-2 px-1.5 py-[1px] text-[8.5px] text-emerald-200">✓ ready</span>}
      </span>
      <span className="relative mt-3 block overflow-hidden">
        <span className={cn("block truncate text-[13px] font-semibold", active ? "text-cyan-200" : "text-white")}>{entry.title}</span>
        <span className="block truncate text-[11px] text-white/50">{entry.artist}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {badge && <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-cyan-200">{badge}</span>}
          <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/60">{entry.genre}</span>
          <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/40">{entry.year}</span>
        </span>
      </span>
    </motion.button>
  );
}
