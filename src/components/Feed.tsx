"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, List, Play, Shuffle, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { SongGrid, SongList, QuickPlayButton, ShuffleButton } from "@/components/SongList";
import { SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { GENRES } from "@/lib/catalog";
import { formatDuration, type Song } from "@/lib/types";
import { usePlayer } from "@/store/player";
import { warmList } from "@/lib/preloader";
import { cn } from "@/lib/cn";

export type SortKey = "relevance" | "title" | "artist" | "duration" | "popularity";
export type DurationFilter = "any" | "short" | "medium" | "long";

/**
 * Reusable discovery feed (trending, genres, mixes, search, artists).
 * Supports sorting, duration/popularity filters, grid|list layout and
 * preloading of the first results so playback starts instantly.
 */
export function Feed({
  endpoint,
  title,
  eyebrow,
  subtitle,
  action,
  initial,
  showFilters = true,
  layout = "list",
  cols,
  emptyMessage = "Nothing found in this corner of the galaxy.",
  onLoaded,
}: {
  endpoint?: string;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  action?: React.ReactNode;
  initial?: Song[];
  showFilters?: boolean;
  layout?: "list" | "grid" | "carousel";
  cols?: string;
  emptyMessage?: string;
  onLoaded?: (songs: Song[]) => void;
}) {
  const [songs, setSongs] = useState<Song[]>(initial || []);
  const [loading, setLoading] = useState(!initial?.length);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("any");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">(layout === "grid" ? "grid" : "list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const playContext = usePlayer((s) => s.playContext);

  const load = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      const data = await api<{ results: Song[] }>(endpoint);
      const list = data.results || [];
      setSongs(list);
      warmList(list, 3);
      onLoaded?.(list);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...songs];
    if (genreFilter !== "all") list = list.filter((s) => (s.genre || "").toLowerCase().includes(genreFilter.toLowerCase()));
    if (durationFilter === "short") list = list.filter((s) => s.duration > 0 && s.duration < 180);
    if (durationFilter === "medium") list = list.filter((s) => s.duration >= 180 && s.duration <= 360);
    if (durationFilter === "long") list = list.filter((s) => s.duration > 360);
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "artist") list.sort((a, b) => a.artist.localeCompare(b.artist));
    if (sort === "duration") list.sort((a, b) => b.duration - a.duration);
    if (sort === "popularity") list.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    return list;
  }, [songs, sort, durationFilter, genreFilter]);

  const totalDuration = filtered.reduce((a, b) => a + (b.duration || 0), 0);

  const header = title ? (
    <SectionTitle
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle || (filtered.length ? `${filtered.length} tracks · ${formatDuration(totalDuration)} of audio` : undefined)}
      action={
        action ??
        (filtered.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <QuickPlayButton songs={filtered} />
            <ShuffleButton songs={filtered} />
          </div>
        ) : undefined)
      }
    />
  ) : null;

  const toolbar = showFilters && (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button onClick={() => setFiltersOpen((v) => !v)} className={cn("glass-btn flex items-center gap-2 !rounded-full px-3.5 py-2 text-xs", filtersOpen && "border-cyan-300/50 text-cyan-200")}>
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
      </button>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as SortKey)}
        aria-label="Sort results"
        className="glass-input !rounded-full px-3 py-2 text-xs"
      >
        <option value="relevance">Sort: Relevance</option>
        <option value="title">Sort: Title</option>
        <option value="artist">Sort: Artist</option>
        <option value="duration">Sort: Duration</option>
        <option value="popularity">Sort: Popularity</option>
      </select>
      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={() => setView("list")} aria-label="List view" className={cn("glass-btn flex h-9 w-9 items-center justify-center rounded-xl !px-0", view === "list" && "border-cyan-300/60 text-cyan-200")}>
          <List className="h-4 w-4" />
        </button>
        <button onClick={() => setView("grid")} aria-label="Grid view" className={cn("glass-btn flex h-9 w-9 items-center justify-center rounded-xl !px-0", view === "grid" && "border-cyan-300/60 text-cyan-200")}>
          <Grid2x2 className="h-4 w-4" />
        </button>
      </div>

      {filtersOpen && (
        <div className="glass-soft w-full space-y-3 p-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/70">Duration</p>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "short", "medium", "long"] as DurationFilter[]).map((d) => (
                <button key={d} onClick={() => setDurationFilter(d)} className={cn("glass-badge px-3 py-1.5 capitalize transition", durationFilter === d ? "border-cyan-300/70 text-cyan-100" : "text-white/60 hover:text-white")}>
                  {d === "short" ? "Under 3 min" : d === "medium" ? "3–6 min" : d === "long" ? "Over 6 min" : "Any length"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-violet-200/70">Genre</p>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              <button onClick={() => setGenreFilter("all")} className={cn("glass-badge shrink-0 px-3 py-1.5", genreFilter === "all" ? "border-violet-300/70 text-violet-100" : "text-white/60")}>
                All genres
              </button>
              {GENRES.slice(0, 24).map((g) => (
                <button key={g.slug} onClick={() => setGenreFilter(g.name)} className={cn("glass-badge shrink-0 px-3 py-1.5", genreFilter === g.name ? "border-violet-300/70 text-violet-100" : "text-white/60")}>
                  {g.icon} {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {header}
      {toolbar}
      {loading ? (
        <SongRowSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="glass-soft flex flex-col items-center gap-3 p-10 text-center">
          <span className="text-3xl">🛰️</span>
          <p className="text-sm text-white/55">{emptyMessage}</p>
          {endpoint && (
            <button onClick={load} className="glass-btn px-4 py-2 text-xs">
              Retry
            </button>
          )}
        </div>
      ) : view === "grid" || layout === "grid" ? (
        <SongGrid songs={filtered} cols={cols} />
      ) : layout === "carousel" ? (
        <Carousel songs={filtered} />
      ) : (
        <SongList songs={filtered} />
      )}
    </div>
  );
}

function Carousel({ songs }: { songs: Song[] }) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const el = carouselRef.current;
  const playContext = usePlayer((s) => s.playContext);
  const scrollBy = (dir: number) => el?.scrollBy({ left: dir * 520, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={carouselRef} className="no-scrollbar snap-x-mandatory flex gap-4 overflow-x-auto pb-3">
        {songs.map((s, i) => (
          <div key={`${s.id}-${i}`} className="snap-start-item w-[210px] shrink-0 sm:w-[236px]">
            <div className="glass glass-card group relative overflow-hidden p-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                {s.thumbnail ? <img src={s.thumbnail} alt={s.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /> : <span className="flex h-full w-full items-center justify-center text-3xl">🌠</span>}
                <button onClick={() => playContext(songs, i)} aria-label={`Play ${s.title}`} className="glass-btn glass-btn-primary absolute bottom-2.5 right-2.5 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full !px-0 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 animate-pulse-ring">
                  <Play className="ml-0.5 h-4 w-4 fill-white" />
                </button>
              </div>
              <p className="mt-3 truncate text-[13px] font-semibold text-white">{s.title}</p>
              <p className="truncate text-[11.5px] text-white/50">{s.artist}</p>
              <div className="mt-2 flex items-center justify-between">
                {s.genre ? <span className="glass-badge px-2 py-0.5 text-[9px] text-violet-200">{s.genre}</span> : <span className="glass-badge px-2 py-0.5 text-[9px] text-white/40">{s.source}</span>}
                <span className="text-[10.5px] text-white/35">{formatDuration(s.duration)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-1 md:flex">
        <button onClick={() => scrollBy(-1)} aria-label="Scroll left" className="glass-btn pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full !px-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => scrollBy(1)} aria-label="Scroll right" className="glass-btn pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full !px-0">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function parseViews(views?: string): number {
  if (!views) return 0;
  const n = parseFloat(views.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return 0;
  if (/B/i.test(views)) return n * 1e9;
  if (/M/i.test(views)) return n * 1e6;
  if (/K/i.test(views)) return n * 1e3;
  return n;
}

