"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Search, ShieldCheck, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { SongRow } from "@/components/SongList";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { warmList } from "@/lib/preloader";
import { playSwoosh, playHover } from "@/lib/soundEffects";
import { formatTotalDuration, type Song } from "@/lib/types";
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
  subGroups?: { label: string; entryIds: string[] }[];
  entries: CatalogEntry[];
}

/**
 * Reusable catalogue hub with the exact layout of the NCS page:
 * gradient hero → filter chips → resolved full-length track list.
 * Chips come from the section's sub-groups when it has them (Geometry Dash
 * OST), otherwise from genres plus a vocal/solo split.
 */
export function CatalogHub({
  sectionId,
  description,
  siblings = [],
  eyebrow = "Catalogue",
}: {
  sectionId: string;
  description?: string;
  siblings?: { href: string; label: string }[];
  eyebrow?: string;
}) {
  const [section, setSection] = useState<CatalogSection | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { playContext, setShuffle, current, playing, toggle } = usePlayer();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    api<{ sections: CatalogSection[] }>("/api/catalog")
      .then((d) => alive && setSection((d.sections || []).find((s) => s.id === sectionId) || null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [sectionId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<{ tracks: Song[] }>(`/api/catalog/${encodeURIComponent(sectionId)}?limit=80`)
      .then((d) => {
        if (!alive) return;
        setTracks(d.tracks || []);
        warmList(d.tracks || [], 3);
      })
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sectionId]);

  const entries = section?.entries || [];

  const chips = useMemo(() => {
    const out: { key: string; label: string; ids: string[] }[] = [{ key: "all", label: "Everything", ids: entries.map((e) => e.id) }];
    if (section?.subGroups?.length) {
      for (const g of section.subGroups) out.push({ key: g.label, label: g.label, ids: g.entryIds });
      return out;
    }
    const genres = [...new Set(entries.map((e) => e.genre).filter(Boolean))];
    for (const g of genres) out.push({ key: `genre:${g}`, label: g, ids: entries.filter((e) => e.genre === g).map((e) => e.id) });
    if (entries.some((e) => /feat\.|&/.test(e.artist))) {
      out.push({ key: "vocal", label: "🎙️ Vocal / features", ids: entries.filter((e) => /feat\.|&/.test(e.artist)).map((e) => e.id) });
      out.push({ key: "solo", label: "🎹 Solo", ids: entries.filter((e) => !/feat\.|&/.test(e.artist)).map((e) => e.id) });
    }
    return out;
  }, [entries, section?.subGroups]);

  const activeIds = useMemo(() => new Set(chips.find((c) => c.key === chip)?.ids || entries.map((e) => e.id)), [chips, chip, entries]);

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => activeIds.has(e.id) && (!q || e.title.toLowerCase().includes(q) || e.artist.toLowerCase().includes(q) || String(e.year) === q));
  }, [entries, activeIds, query]);

  const songFor = (entry: CatalogEntry) =>
    tracks.find((t) => {
      const token = entry.title.toLowerCase().split(" ")[0];
      return t.title.toLowerCase().includes(token) && (t.artist.toLowerCase().includes(entry.artist.toLowerCase().split(/ feat\.| & /)[0].slice(0, 6)) || t.album?.includes(section?.title || ""));
    }) || tracks.find((t) => t.title.toLowerCase().includes(entry.title.toLowerCase().split(" ")[0]));

  const rows = visibleEntries.map((entry) => ({ entry, song: songFor(entry) }));
  const playable = rows.map((r) => r.song).filter(Boolean) as Song[];
  const totalSeconds = playable.reduce((a, b) => a + (b.duration || 0), 0);

  const playOne = async (entry: CatalogEntry) => {
    const song = songFor(entry);
    if (song) {
      playContext(playable.length ? playable : [song], Math.max(0, playable.findIndex((s) => s.id === song.id)));
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

  const playList = (shuffle = false) => {
    if (!playable.length) {
      toast("Streams are still resolving — tap any track to play it now", "info");
      return;
    }
    if (shuffle) setShuffle(true);
    playContext(shuffle ? [...playable].sort(() => Math.random() - 0.5) : playable, 0);
  };

  if (!section) {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-16 pt-8 sm:px-6">
        <div className="skeleton h-56 w-full" />
        <SongRowSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      {/* ── hero (NCS layout) ── */}
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="absolute inset-0 opacity-50" style={{ background: section.gradient }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/60 to-transparent" />
        <span className="animate-float absolute -right-12 -top-14 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GlassBadge tone="cyan">
              <ShieldCheck className="h-3 w-3" /> {section.copyright}
            </GlassBadge>
            <GlassBadge tone="gold">{eyebrow}</GlassBadge>
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">
            <span className="text-4xl">{section.icon}</span> {section.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
            {description || section.subtitle} · {entries.length} tracks
            {playable.length ? ` · ${playable.length} streams ready · ${formatTotalDuration(totalSeconds)}` : " · resolving streams…"}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => playList(false)} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold">
              <Play className="h-4 w-4 fill-white" /> Play all
            </button>
            <button onClick={() => playList(true)} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm">
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${section.title}…`} className="glass-input w-full py-2.5 pl-10 text-sm" />
            </div>
            {siblings.map((s) => (
              <Link key={s.href} href={s.href} className="glass-btn !rounded-full px-4 py-2.5 text-xs">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ── chips (NCS collection row) ── */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              playSwoosh();
              setChip(c.key);
            }}
            className={cn("glass-btn flex shrink-0 items-center gap-1.5 !rounded-full px-4 py-2 text-[11.5px]", chip === c.key && "glass-btn-primary font-semibold")}
          >
            {c.label}
            <span className="text-[10px] opacity-60">{c.ids.length}</span>
          </button>
        ))}
      </div>

      {/* ── tracks (NCS list) ── */}
      <section>
        <SectionTitle
          eyebrow={chips.find((c) => c.key === chip)?.label || section.title}
          title={query ? `Results for “${query}”` : `${section.title} tracks`}
          subtitle={`${rows.length} tracks · each listed once · ${playable.length} ready to stream full-length`}
        />
        {loading ? (
          <SongRowSkeleton rows={8} />
        ) : rows.length ? (
          <div className="space-y-2">
            {rows.map(({ entry, song }, i) =>
              song ? (
                <SongRow key={entry.id} song={song} context={playable} position={i} showAlbum={false} />
              ) : (
                <motion.button
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onMouseEnter={playHover}
                  onClick={() => void playOne(entry)}
                  className="glass-soft group flex w-full items-center gap-3 p-2.5 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-gradient-to-br from-violet-700/40 to-cyan-500/30">
                    {entry.cover ? (
                      <img src={entry.cover} alt="" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg">{section.icon}</span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                      {busyId === entry.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Play className="h-4 w-4 fill-white" />}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white">{entry.title}</span>
                    <span className="block truncate text-[11.5px] text-white/50">{entry.artist}</span>
                  </span>
                  <span className="glass-badge px-2 py-0.5 text-[9px] text-white/45">{entry.genre}</span>
                  <span className="glass-badge px-2 py-0.5 text-[9px] text-amber-200/80">resolving</span>
                </motion.button>
              )
            )}
          </div>
        ) : (
          <p className="glass-soft p-8 text-center text-sm text-white/55">Nothing matches this filter.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {current && playing ? (
          <button onClick={toggle} className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2 text-xs">
            <Pause className="h-3.5 w-3.5" /> Pause {current.title}
          </button>
        ) : null}
        {siblings.map((s) => (
          <Link key={s.href} href={s.href} className="glass-btn !rounded-full px-4 py-2 text-xs">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
