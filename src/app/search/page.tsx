"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dice5, Mic, Search as SearchIcon, X } from "lucide-react";
import { searchApi } from "@/lib/api";
import { Feed } from "@/components/Feed";
import { SongGrid, SongList } from "@/components/SongList";
import { GlassBadge, SectionTitle } from "@/components/ui/Glass";
import { FEATURED_PLAYLISTS, GENRES, TRENDING_SEARCHES } from "@/lib/catalog";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { usePlayer } from "@/store/player";
import { warmList } from "@/lib/preloader";
import type { Song } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = ["All", "Songs", "Quran", "Nasheed", "Newgrounds", "NCS", "Artists", "Albums", "Playlists", "Genres"] as const;
type Tab = (typeof TABS)[number];

function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") || "";
  const [tab, setTab] = useState<Tab>("All");
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(q);
  const [listening, setListening] = useState(false);
  const { searches, recordSearch } = useSession();
  const { toast } = useUi();
  const playContext = usePlayer((s) => s.playContext);

  useEffect(() => {
    setInput(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let alive = true;
    setLoading(true);
    searchApi(q, 30)
      .then((data) => {
        if (!alive) return;
        setResults(data.results);
        setSuggestions(data.suggestions);
        warmList(data.results, 3);
        recordSearch(q);
      })
      .catch(() => alive && setResults([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const artists = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of results) if (!map.has(s.artist)) map.set(s.artist, s);
    return [...map.entries()].map(([name, song]) => ({ name, song }));
  }, [results]);

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; song: Song }>();
    for (const s of results) {
      const key = `${s.artist}::${s.album || s.title}`;
      if (!map.has(key)) map.set(key, { name: s.album || s.title, artist: s.artist, song: s });
    }
    return [...map.values()];
  }, [results]);

  const genreMatches = GENRES.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()) || g.slug.includes(q.toLowerCase().replace(/\s+/g, "-")));
  const playlistMatches = FEATURED_PLAYLISTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase()));

  const submit = (value: string) => {
    if (!value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  const voice = () => {
    const W = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const R = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!R) {
      toast("Voice search is unavailable in this browser", "error");
      return;
    }
    const rec = new R();
    rec.lang = "en-US";
    setListening(true);
    rec.onresult = (e: any) => submit(e.results?.[0]?.[0]?.transcript || "");
    rec.onerror = () => toast("Could not hear you", "error");
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const lucky = () => {
    const pick = results.length ? results[Math.floor(Math.random() * results.length)] : null;
    if (pick) {
      playContext(results, results.indexOf(pick));
      toast(`Feeling lucky 🍀 ${pick.title}`, "success");
      return;
    }
    const term = TRENDING_SEARCHES[Math.floor(Math.random() * TRENDING_SEARCHES.length)];
    submit(term);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-strong p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(input)}
              placeholder="Search any song, artist, album or genre…"
              aria-label="Search"
              className="glass-input w-full py-3.5 pl-11 pr-10 text-sm"
            />
            {input && (
              <button onClick={() => setInput("")} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={voice} aria-label="Voice search" className={cn("glass-btn flex items-center gap-2 !rounded-full px-4 py-3 text-xs", listening && "border-pink-300/70 text-pink-200 animate-pulse-ring")}>
              <Mic className="h-4 w-4" /> Voice
            </button>
            <button onClick={lucky} className="glass-btn flex items-center gap-2 !rounded-full px-4 py-3 text-xs">
              <Dice5 className="h-4 w-4" /> Feeling lucky
            </button>
          </div>
        </div>

        {!q && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-200/80">Trending searches</p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((t) => (
                  <button key={t} onClick={() => submit(t)} className="glass-badge px-3 py-1.5 text-white/70 hover:text-white">{t}</button>
                ))}
              </div>
            </div>
            {(searches.length > 0) && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-violet-200/80">Your recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {searches.map((t) => (
                    <button key={t} onClick={() => submit(t)} className="glass-badge px-3 py-1.5 text-white/60 hover:text-white">{t}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-pink-200/80">Browse by genre</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.slice(0, 14).map((g) => (
                  <Link key={g.slug} href={`/genre/${g.slug}`} className="glass-badge px-3 py-1.5 text-white/60 hover:text-white">{g.icon} {g.name}</Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {q && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("glass-btn !rounded-full px-4 py-2 text-xs", tab === t && "glass-btn-primary font-semibold")}>
                {t === "Songs" ? "🎵" : t === "Quran" ? "🕌" : t === "Nasheed" ? "🎤" : t === "Newgrounds" ? "🎼" : t === "NCS" ? "🔊" : t === "Artists" ? "🎤" : t === "Albums" ? "💿" : t === "Playlists" ? "📂" : t === "Genres" ? "🏷️" : "✨"} {t}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-white/45">{loading ? "Scanning the index…" : `${results.length} songs found`}</span>
          </div>
        )}
      </motion.header>

      {q && !loading && results.length === 0 && (
        <div className="glass-soft p-10 text-center">
          <p className="text-3xl">🛰️</p>
          <p className="mt-3 text-sm text-white/60">No signal for “{q}”. Try a different spelling, or browse a genre instead.</p>
        </div>
      )}

      {q && results.length > 0 && (tab === "All" || tab === "Songs") && (
        <Feed initial={results} title={tab === "All" ? `Results for “${q}”` : `Songs for “${q}”`} eyebrow="Full-length streams" subtitle={suggestions.length ? `Try also: ${suggestions.slice(0, 3).join(", ")}` : undefined} />
      )}

      {q && tab === "All" && artists.length > 0 && (
        <section>
          <SectionTitle title="Artists" />
          <div className="flex flex-wrap gap-2">
            {artists.slice(0, 8).map((a) => (
              <Link key={a.name} href={`/artist/${encodeURIComponent(a.name)}`} className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2 text-xs">
                <span className="h-6 w-6 overflow-hidden rounded-full border border-white/20">{a.song.thumbnail && <img src={a.song.thumbnail} alt="" className="h-full w-full object-cover" />}</span>
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && tab === "Quran" && (
        <section>
          <SectionTitle eyebrow="القرآن الكريم" title={`Surahs matching “${q}”`} subtitle="Full-surah recitation, seekable, free and legal via alquran.cloud" />
          {results.filter((r) => r.source === "quran").length ? (
            <SongList songs={results.filter((r) => r.source === "quran")} showAlbum={false} numbered={false} />
          ) : (
            <p className="glass-soft p-8 text-center text-sm text-white/55">
              No surah matched. Try an Arabic name (الكهف), a transliteration (Al-Kahf) or a number (18).
            </p>
          )}
        </section>
      )}

      {q && tab === "Nasheed" && (
        <section>
          <SectionTitle eyebrow="أناشيد" title={`Nasheeds matching “${q}”`} />
          {results.filter((r) => r.genre === "Nasheed").length ? (
            <SongList songs={results.filter((r) => r.genre === "Nasheed")} showAlbum={false} numbered={false} />
          ) : (
            <p className="glass-soft p-8 text-center text-sm text-white/55">No nasheed matched this search.</p>
          )}
        </section>
      )}

      {q && tab === "Newgrounds" && (
        <Feed
          endpoint={`/api/ng/search?q=${encodeURIComponent(q)}&limit=30`}
          title={`Newgrounds Audio Portal · “${q}”`}
          eyebrow="Copyright free"
          subtitle="Live portal results when Newgrounds answers our edge, resolved full-length mirrors otherwise"
          emptyMessage="No Newgrounds tracks matched this search."
        />
      )}

      {q && tab === "NCS" && (
        <Feed
          endpoint={`/api/ncs/search?q=${encodeURIComponent(q)}&limit=30`}
          title={`NoCopyrightSounds · “${q}”`}
          eyebrow="100% free to use"
          emptyMessage="No NCS releases matched this search."
        />
      )}

      {q && tab === "Artists" && (
        <section>
          <SectionTitle title={`Artists for “${q}”`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {artists.map((a) => (
              <Link key={a.name} href={`/artist/${encodeURIComponent(a.name)}`} className="glass glass-card p-4 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/20">
                  {a.song.thumbnail ? <img src={a.song.thumbnail} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">🎤</span>}
                </span>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-white">{a.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && (tab === "Albums") && (
        <section>
          <SectionTitle title={`Albums & releases for “${q}”`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {albums.map((a) => (
              <Link key={`${a.artist}-${a.name}`} href={`/album/${encodeURIComponent(`${a.artist} — ${a.name}`)}`} className="glass glass-card p-3">
                <span className="block aspect-square overflow-hidden rounded-xl border border-white/10">{a.song.thumbnail && <img src={a.song.thumbnail} alt="" className="h-full w-full object-cover" />}</span>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-white">{a.name}</p>
                <p className="truncate text-[11px] text-white/50">{a.artist}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && tab === "Playlists" && (
        <section>
          <SectionTitle title={`Playlists matching “${q}”`} />
          <SongGrid
            songs={playlistMatches.length ? playlistMatches.map((p) => ({ id: `mix:${p.slug}`, title: p.name, artist: p.creator, duration: 0, thumbnail: "", source: "audius", genre: p.slug })) : results.slice(0, 8)}
          />
          {playlistMatches.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {playlistMatches.map((p) => (
                <Link key={p.slug} href={`/mix/${p.slug}`} className="glass-btn !rounded-full px-4 py-2 text-xs">{p.icon} {p.name}</Link>
              ))}
            </div>
          )}
        </section>
      )}

      {q && tab === "Genres" && (
        <section>
          <SectionTitle title={`Genres matching “${q}”`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(genreMatches.length ? genreMatches : GENRES.slice(0, 8)).map((g) => (
              <Link key={g.slug} href={`/genre/${g.slug}`} className="glass glass-card relative overflow-hidden p-4">
                <span className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
                <span className="relative text-2xl">{g.icon}</span>
                <p className="relative mt-2 font-display text-sm font-bold text-white">{g.name}</p>
                <p className="relative mt-1 line-clamp-2 text-[11px] text-white/60">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && tab === "All" && results.length > 0 && (
        <section>
          <GlassBadge tone="gold">Tip</GlassBadge>
          <p className="mt-2 text-[12.5px] text-white/55">Right-click (or tap “…”) on any track for play-next, queue, like, add-to-playlist, radio, share and offline download.</p>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1500px] px-6 pt-10"><div className="skeleton h-28 w-full" /></div>}>
      <SearchClient />
    </Suspense>
  );
}
