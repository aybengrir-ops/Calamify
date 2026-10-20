"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mic, Play, Search, ShieldCheck, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}
interface Reciter {
  id: string;
  name: string;
  nameEn: string;
  country?: string;
}
interface Ayah {
  number: number;
  text: string;
  juz: number;
  page: number;
}

/**
 * القرآن الكريم — 114 surahs × 176 reciters, streamed full-surah (seekable)
 * through our own proxy, with the Arabic text from alquran.cloud.
 */
export function QuranSection({ variant = "section" }: { variant?: "section" | "page" }) {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [verses, setVerses] = useState<Ayah[]>([]);
  const [loadingText, setLoadingText] = useState(false);
  const [showAllReciters, setShowAllReciters] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const { playContext, setShuffle } = usePlayer();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    api<{ surahs: Surah[] }>("/api/quran/surahs").then((d) => alive && setSurahs(d.surahs || [])).catch(() => undefined);
    api<{ reciters: Reciter[] }>("/api/quran/reciters")
      .then((d) => alive && setReciters(d.reciters || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingTracks(true);
    api<{ tracks: Song[] }>(`/api/quran/surahs?tracks=1&reciter=${encodeURIComponent(reciter)}`)
      .then((d) => alive && setTracks(d.tracks || []))
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoadingTracks(false));
    return () => {
      alive = false;
    };
  }, [reciter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) => s.name.includes(query.trim()) || s.englishName.toLowerCase().includes(q) || s.englishNameTranslation.toLowerCase().includes(q) || String(s.number) === q
    );
  }, [surahs, query]);

  const openSurah = async (surah: Surah, autoplay = true) => {
    setSelected(surah.number);
    setLoadingText(true);
    setVerses([]);
    if (autoplay) {
      const idx = tracks.findIndex((t) => t.id.endsWith(`:${surah.number}`));
      if (tracks.length && idx >= 0) playContext(tracks, idx);
      else toast("Loading recitation…", "info");
    }
    api<{ verses: Ayah[] }>(`/api/quran/text/${surah.number}`)
      .then((d) => setVerses(d.verses || []))
      .catch(() => setVerses([]))
      .finally(() => setLoadingText(false));
  };

  const activeReciter = reciters.find((r) => r.id === reciter);
  const visibleReciters = showAllReciters ? reciters : reciters.slice(0, 12);

  return (
    <section className={cn("mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6", variant === "page" && "pt-8")}>
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 text-center sm:p-10">
        <span className="absolute inset-0 opacity-35" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.35), transparent 60%), linear-gradient(135deg,#065f46,#0d1b2a)" }} />
        <span className="animate-float absolute -right-14 -top-14 h-52 w-52 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative">
          <p className="quran-ornament">﷽</p>
          <h2 className="gradient-text-gold mt-2 font-display text-3xl font-bold sm:text-5xl">القرآن الكريم</h2>
          <p className="mt-2 text-sm text-white/70 sm:text-base">The Holy Quran — all 114 surahs, 176 reciters, full-surah audio with seeking.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <GlassBadge tone="gold">🕌 {surahs.length || 114} Surahs</GlassBadge>
            <GlassBadge tone="gold">🎙️ {reciters.length || 176} Reciters</GlassBadge>
            <GlassBadge tone="cyan">
              <ShieldCheck className="h-3 w-3" /> Free & legal · alquran.cloud
            </GlassBadge>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={() => tracks.length && playContext(tracks, 0)} disabled={!tracks.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
              <Play className="h-4 w-4 fill-white" /> Play from Al-Fatiha
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
              <Shuffle className="h-4 w-4" /> Shuffle surahs
            </button>
            {variant === "section" && (
              <Link href="/quran" className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm">
                <BookOpen className="h-4 w-4" /> Open the Mushaf
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* reciters */}
      <div className="mt-10">
        <SectionTitle eyebrow="🎙️ القارئ" title="Choose reciter" subtitle={activeReciter ? `Now reciting: ${activeReciter.nameEn || activeReciter.name}` : undefined} />
        <div className="glass-reciter-grid">
          {visibleReciters.map((r, i) => (
            <motion.button key={r.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: (i % 12) * 0.03 }} onClick={() => setReciter(r.id)} className={cn("glass-reciter-card", reciter === r.id && "active")}>
              <span className="text-lg">{r.country || "🎙️"}</span>
              <p className="reciter-name-ar">{r.name}</p>
              <p className="reciter-name-en">{r.nameEn || r.id}</p>
            </motion.button>
          ))}
        </div>
        {reciters.length > 12 && (
          <button onClick={() => setShowAllReciters((v) => !v)} className="glass-btn mt-3 !rounded-full px-4 py-2 text-xs">
            {showAllReciters ? "Show fewer reciters" : `Show all ${reciters.length} reciters`}
          </button>
        )}
      </div>

      {/* surah search */}
      <div className="mt-8">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن سورة… / Search surah by name or number" dir="auto" className="glass-input w-full py-3 pl-10 text-sm" />
        </div>
      </div>

      {/* surah list */}
      <div className="mt-6">
        <SectionTitle eyebrow="📖 السور" title="All surahs" subtitle={`${filtered.length} surahs · tap to play the full recitation and read the text`} />
        {loadingTracks && !tracks.length ? (
          <SongRowSkeleton rows={4} />
        ) : (
          <div className="glass-surah-grid">
            {filtered.map((s, i) => (
              <motion.button key={s.number} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: (i % 12) * 0.02 }} onClick={() => void openSurah(s)} className={cn("glass-surah-card", selected === s.number && "active")}>
                <span className="surah-number-glass">
                  <span>{s.number}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="surah-name-ar truncate">{s.name}</span>
                    <span className="surah-name-en shrink-0">{s.englishName}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[10.5px] text-white/45">
                    <span>{s.numberOfAyahs} ayahs</span>
                    <span className={cn("glass-badge px-1.5 py-[1px] text-[9px]", s.revelationType === "Meccan" ? "text-amber-200" : "text-emerald-200")}>{s.revelationType}</span>
                  </span>
                </span>
                <span className="glass-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full !px-0">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* text */}
      {selected && (
        <div className="mt-10">
          <SectionTitle eyebrow="📜 النص" title={`${surahs.find((s) => s.number === selected)?.englishName || ""} · ${surahs.find((s) => s.number === selected)?.name || ""}`} subtitle={activeReciter ? `Recited by ${activeReciter.nameEn || activeReciter.name}` : undefined} />
          <div className="glass-strong p-4 sm:p-6">
            {loadingText ? (
              <div className="space-y-3 py-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-6 w-full" />
                ))}
              </div>
            ) : verses.length ? (
              <div className="glass-quran-text" dir="rtl" lang="ar">
                {selected !== 1 && selected !== 9 && <p className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}
                {verses.map((v) => (
                  <span key={v.number} className="quran-verse">
                    {selected === 1 && v.number === 1 ? v.text.replace(/^بِسْمِ اللَّهِ الرَّحْمَ[ـٰ]?نِ الرَّحِيمِ\s*/, "") : v.text}
                    <span className="verse-number-glass">﴿{v.number}﴾</span>{" "}
                  </span>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-white/50">Text unavailable offline for this surah.</p>
            )}
          </div>
        </div>
      )}

      {/* recitation queue preview */}
      <div className="mt-10">
        <SectionTitle eyebrow="Full-surah audio" title={`${activeReciter?.nameEn || "Reciter"} · surah player`} subtitle="Every surah is a normal Calamify track: queue it, like it, add it to a playlist, download it for offline." />
        {loadingTracks ? <SongRowSkeleton rows={5} /> : <SurahTrackList tracks={tracks.slice(0, 12)} />}
      </div>
    </section>
  );
}

function SurahTrackList({ tracks }: { tracks: Song[] }) {
  const playContext = usePlayer((s) => s.playContext);
  const current = usePlayer((s) => s.current);
  if (!tracks.length) return <p className="glass-soft p-6 text-center text-sm text-white/50">No recitations loaded.</p>;
  return (
    <div className="space-y-2">
      {tracks.map((t, i) => (
        <button key={t.id} onClick={() => playContext(tracks, i)} className={cn("glass-soft group flex w-full items-center gap-3 p-3 text-left transition hover:border-amber-300/40 hover:bg-white/10", current?.id === t.id && "border-amber-300/50 bg-amber-400/10")}>
          <span className="glass-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl !px-0 text-amber-200">
            <Mic className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-white">{t.title}</span>
            <span className="block truncate text-[11.5px] text-white/50">{t.artist}</span>
          </span>
          <span className="glass-badge hidden px-2 py-0.5 text-[9px] text-emerald-200 sm:inline-flex">✓ free</span>
          <Play className="h-4 w-4 shrink-0 fill-white/70 text-white/70 transition group-hover:fill-white" />
        </button>
      ))}
    </div>
  );
}
