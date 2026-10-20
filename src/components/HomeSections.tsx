"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Disc3, Headphones, Play, QrCode, Smartphone, Star, Users } from "lucide-react";
import { GENRES, FEATURED_PLAYLISTS, MOODS, TESTIMONIALS, STATS } from "@/lib/catalog";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { SongCarousel, SongCard } from "@/components/SongList";
import { Feed } from "@/components/Feed";
import { trendingApi } from "@/lib/api";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { formatTotalDuration, greeting, type Song } from "@/lib/types";
import { cn } from "@/lib/cn";

/* ---------------- personalized home rows ---------------- */
export function PersonalizedHome() {
  const { user, history, playlists, likes } = useSession();
  const playContext = usePlayer((s) => s.playContext);
  const continueListening = history.slice(0, 8).map((h) => h.song);
  const dailyMixes = useMemo(
    () =>
      FEATURED_PLAYLISTS.slice(0, 3).map((p, i) => ({
        ...p,
        name: i === 0 ? `${user ? user.displayName.split(" ")[0] + "’s" : "Your"} Daily Mix` : p.name,
      })),
    [user]
  );

  if (!user && continueListening.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6">
        <div className="glass-strong relative overflow-hidden p-6 sm:p-8">
          <span className="animate-float absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-500/25 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">{greeting()}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">Press play and Calamify learns your orbit</h2>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Sign in to keep liked songs, playlists, listening history and daily mixes synced across every device — or just start exploring as a guest. Everything plays full-length either way.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/trending" className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-3 text-sm font-semibold">
                <Play className="h-4 w-4 fill-white" /> Play trending now
              </Link>
              <Link href="/explore" className="glass-btn flex items-center gap-2 !rounded-full px-5 py-3 text-sm">
                Browse genres <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-10 px-4 py-10 sm:px-6">
      <div>
        <SectionTitle eyebrow="Welcome back" title={greeting(user?.displayName)} subtitle={`${likes.length} liked songs · ${playlists.length} playlists · ${history.length} recent plays`} />
        {continueListening.length > 0 ? (
          <SongCarousel songs={continueListening} />
        ) : (
          <p className="glass-soft p-4 text-sm text-white/55">Play something and it will show up here for instant replay.</p>
        )}
      </div>

      <div>
        <SectionTitle eyebrow="Made for you" title="Your Daily Mix" subtitle="Regenerated from everything you have played recently" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dailyMixes.map((m, i) => (
            <Link key={m.slug} href={`/mix/${m.slug}`} className="glass glass-card group relative overflow-hidden p-4">
              <span className="absolute inset-0 opacity-45 transition group-hover:opacity-70" style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }} />
              <div className="relative flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-black/25 text-2xl backdrop-blur-md">{m.icon}</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-white">{m.name}</p>
                  <p className="truncate text-xs text-white/70">{m.description}</p>
                  <span className="glass-badge mt-2 inline-block px-2 py-0.5 text-[9px] text-white/80">Mix #{i + 1}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle eyebrow="Jump back in" title="Recently played" action={<Link href="/history" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">Full history <ArrowRight className="h-3.5 w-3.5" /></Link>} />
        <SongCarousel songs={history.slice(0, 12).map((h) => h.song)} />
      </div>

      <div>
        <SectionTitle eyebrow="Moods & activities" title="How does the cosmos feel today?" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOODS.map((m) => (
            <Link key={m.name} href={`/mix/mood-${m.name.toLowerCase()}`} className="glass glass-card relative overflow-hidden p-4">
              <span className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }} />
              <span className="relative text-2xl">{m.icon}</span>
              <p className="relative mt-2 font-display text-sm font-bold text-white">{m.name}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle eyebrow="Auto-generated" title="Continue the streak" />
        <button onClick={() => playContext(continueListening.length ? continueListening : [], 0)} disabled={!continueListening.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40">
          <Headphones className="h-4 w-4" /> Resume last session
        </button>
      </div>
    </section>
  );
}

/* ---------------- genres ---------------- */
export function GenresGrid({ limit = 24 }: { limit?: number }) {
  const list = GENRES.slice(0, limit);
  return (
    <section id="genres" className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="45+ cosmic genres" title="All the Music in the Galaxy" subtitle="From synthwave nebulas to gospel supernovas — every corner of sound, one tap away." action={<Link href="/explore" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">See all genres <ArrowRight className="h-3.5 w-3.5" /></Link>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {list.map((g, i) => (
          <motion.div key={g.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.45, delay: (i % 12) * 0.04 }}>
            <Link href={`/genre/${g.slug}`} className="glass glass-card group relative block h-28 overflow-hidden p-3">
              <span className="absolute inset-0 opacity-40 transition group-hover:opacity-70" style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
              <span className="absolute -bottom-4 -right-3 text-5xl opacity-25 transition duration-500 group-hover:scale-125 group-hover:opacity-45">{g.icon}</span>
              <span className="relative block font-display text-sm font-bold text-white">{g.name}</span>
              <span className="relative mt-1 line-clamp-2 block max-w-[80%] text-[10.5px] leading-snug text-white/60">{g.description}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- trending ---------------- */
export function TrendingSection() {
  const [songs, setSongs] = useState<Song[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let alive = true;
    trendingApi({ limit: 18 }).then((d) => alive && setSongs(d.results || [])).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  const nudge = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 520, behavior: "smooth" });

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="Live charts" title="What's Orbiting Right Now" subtitle="Auto-refreshing global chart, pulled straight from the source." action={<Link href="/trending" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">Top 50 <ArrowRight className="h-3.5 w-3.5" /></Link>} />
      <div className="relative">
        <div ref={scrollRef} className="no-scrollbar snap-x-mandatory flex gap-4 overflow-x-auto pb-3">
          {songs.length === 0 && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-72 w-[220px] shrink-0" />)}
          {songs.map((s, i) => (
            <div key={`${s.id}-${i}`} className="snap-start-item w-[210px] shrink-0 sm:w-[236px]">
              <SongCard song={s} context={songs} index={i} />
            </div>
          ))}
        </div>
        {songs.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between md:flex">
            <button onClick={() => nudge(-1)} aria-label="Scroll left" className="glass-btn pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full !px-0"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => nudge(1)} aria-label="Scroll right" className="glass-btn pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full !px-0"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- featured playlists ---------------- */
export function FeaturedPlaylists() {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="Hand-curated" title="Curated Cosmic Playlists" subtitle="Eight collections built by the Calamify crew. Hover to peek at the tracklist." action={<Link href="/playlists" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">All playlists <ArrowRight className="h-3.5 w-3.5" /></Link>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED_PLAYLISTS.map((p, i) => (
          <PlaylistCard key={p.slug} playlist={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function PlaylistCard({ playlist, index }: { playlist: (typeof FEATURED_PLAYLISTS)[number]; index: number }) {
  const [tracks, setTracks] = useState<Song[] | null>(null);
  const onEnter = () => {
    if (tracks) return;
    trendingApi({ query: playlist.query, limit: 6 }).then((d) => setTracks(d.results || [])).catch(() => setTracks([]));
  };
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: index * 0.05 }}>
      <Link href={`/mix/${playlist.slug}`} onMouseEnter={onEnter} onFocus={onEnter} className="glass glass-card group relative block overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <span className="absolute inset-0 opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" style={{ background: `linear-gradient(135deg, ${playlist.from}, ${playlist.to})` }} />
          <span className="absolute inset-0 flex items-center justify-center text-6xl opacity-70 transition duration-500 group-hover:scale-125">{playlist.icon}</span>
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-400 group-hover:translate-y-0" style={{ transitionDuration: "400ms" }}>
            <div className="glass-strong p-2.5">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">Tracklist preview</p>
              {!tracks && <p className="text-[11px] text-white/50">Loading…</p>}
              {tracks?.slice(0, 4).map((t) => (
                <p key={t.id} className="truncate text-[11px] text-white/75">♪ {t.title}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="truncate font-display text-base font-bold text-white">{playlist.name}</h3>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-white/55">{playlist.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <GlassBadge tone="purple"><Users className="h-3 w-3" /> {playlist.creator}</GlassBadge>
            <span className="ml-auto text-[10.5px] text-white/40">{tracks?.length ? `${tracks.length}+ tracks` : "∞ tracks"}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ---------------- artists ---------------- */
export function TopArtists() {
  const artists = useMemo(() => {
    const names = ["Queen", "The Weeknd", "Daft Punk", "Billie Eilish", "Coldplay", "Kendrick Lamar", "Tame Impala", "Dua Lipa", "Hans Zimmer", "Tyler, The Creator", "Sade", "ODESZA"];
    return names.map((n, i) => ({ name: n, genre: GENRES[i % GENRES.length].name, icon: GENRES[i % GENRES.length].icon, from: GENRES[i % GENRES.length].from, to: GENRES[i % GENRES.length].to }));
  }, []);
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="Stellar artists" title="Artists Worth Following" subtitle="Tap any artist for their top tracks, releases and an endless radio." action={<Link href="/artists" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs">All artists <ArrowRight className="h-3.5 w-3.5" /></Link>} />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {artists.map((a, i) => (
          <motion.div key={a.name} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}>
            <Link href={`/artist/${encodeURIComponent(a.name)}`} className="group flex w-36 shrink-0 flex-col items-center gap-3 text-center">
              <span className="glass-strong relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full p-1 transition duration-400 group-hover:scale-110">
                <span className="absolute inset-1 rounded-full opacity-70" style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }} />
                <span className="relative text-3xl">{a.icon}</span>
                <span className="absolute inset-0 rounded-full border border-white/25" />
              </span>
              <span>
                <span className="block truncate text-[13px] font-semibold text-white transition group-hover:text-cyan-200">{a.name}</span>
                <span className="block text-[10.5px] text-white/45">{a.genre}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- stats counters ---------------- */
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          setValue(Math.floor(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  const display = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value);
  return <span ref={ref}>{display}{suffix}</span>;
}

export function StatsSection() {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <div className="glass-strong grid grid-cols-2 gap-4 p-6 sm:p-8 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              <Counter target={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- player showcase ---------------- */
export function PlayerShowcase() {
  const { current, playing, position, duration, toggle } = usePlayer();
  const demo: Song = current || { id: "demo", title: "Interstellar Drift", artist: "Calamify Cosmic", duration: 243, thumbnail: "", source: "audius", genre: "Ambient" };
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="Built like a studio deck" title="The Calamify Player" subtitle="Scrub, shuffle, repeat, queue, synced lyrics and a live frequency visualizer — all in glass." />
      <div className="glass-strong relative overflow-hidden p-5 sm:p-8">
        <span className="animate-float absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-600/35 to-cyan-400/25 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-40 w-40 shrink-0">
            <span className="animate-orbit absolute -inset-3 rounded-full border border-white/10" />
            <div className={cn("glass-strong flex h-40 w-40 items-center justify-center overflow-hidden rounded-full p-1.5", playing && "animate-vinyl")}>
              {demo.thumbnail ? <img src={demo.thumbnail} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-[conic-gradient(from_0deg,rgba(123,47,247,0.6),rgba(0,212,255,0.5),rgba(255,46,151,0.5),rgba(123,47,247,0.6))] text-3xl">🪐</span>}
            </div>
            <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#05060f] ring-2 ring-white/40" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="cyan">◉ {demo.source === "audius" ? "full-length stream" : "innertube stream"}</GlassBadge>
              {demo.genre && <GlassBadge tone="purple">{demo.genre}</GlassBadge>}
              <GlassBadge>320 kbps max</GlassBadge>
            </div>
            <h3 className="mt-3 truncate font-display text-2xl font-bold text-white">{demo.title}</h3>
            <p className="truncate text-sm text-white/55">{demo.artist}</p>
            <div className="mt-4">
              <div className="progress-track h-2">
                <div className="progress-fill" style={{ width: `${duration ? (position / duration) * 100 : 32}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/45">
                <span>{Math.floor((duration ? position : 78) / 60)}:{String(Math.floor((duration ? position : 78) % 60)).padStart(2, "0")}</span>
                <span>{Math.floor((duration || demo.duration) / 60)}:{String(Math.floor((duration || demo.duration) % 60)).padStart(2, "0")}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={toggle} className="glass-btn glass-btn-primary flex h-12 w-12 items-center justify-center rounded-full !px-0">
                <Play className={cn("h-5 w-5 fill-white", playing && "hidden")} />
                {playing && <span className="flex h-4 items-end gap-[2px]">{[0, 1, 2].map((i) => <span key={i} className="eq-bar w-[3px] rounded-full bg-white" style={{ height: 14, animationDelay: `${i * 0.15}s` }} />)}</span>}
              </button>
              <Link href="/trending" className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2.5 text-xs">Find something to play <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- app download ---------------- */
export function AppDownload() {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <div className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute right-10 top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/50 to-orange-500/40 blur-xl" />
        <span className="animate-float absolute bottom-8 right-40 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-300/50 to-violet-500/40 blur-lg" style={{ animationDelay: "2s" }} />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_auto_auto]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">Progressive web app</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Take the Universe With You</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
              Install Calamify on your phone or desktop straight from the browser — no app store, no waiting. Offline downloads, lock-screen controls and push notifications included.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2.5 text-xs"><Smartphone className="h-4 w-4" /> App Store · PWA</span>
              <span className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2.5 text-xs"><Play className="h-4 w-4" /> Google Play · PWA</span>
              <Link href="/settings" className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2.5 text-xs"><Disc3 className="h-4 w-4" /> Offline settings</Link>
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="glass-strong relative h-64 w-36 rounded-[26px] p-2">
              <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#05060f]">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(123,47,247,0.7),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(0,212,255,0.5),transparent_60%)]" />
                <span className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/25" />
                <div className="absolute inset-x-2 bottom-2 space-y-1.5">
                  <div className="glass-soft h-10 rounded-lg" />
                  <div className="glass-soft h-10 rounded-lg" />
                  <div className="glass-btn glass-btn-primary h-8 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
          <div className="glass-soft flex flex-col items-center gap-2 p-4">
            <QrCode className="h-20 w-20 text-cyan-200" />
            <p className="text-center text-[11px] text-white/55">Scan to install on any device</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- testimonials ---------------- */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => window.clearInterval(id);
  }, []);
  const visible = [0, 1, 2].map((o) => TESTIMONIALS[(index + o) % TESTIMONIALS.length]);
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6">
      <SectionTitle eyebrow="Signal from listeners" title="What the Galaxy Says" />
      <div className="grid gap-4 md:grid-cols-3">
        {visible.map((t, i) => (
          <motion.div key={`${t.handle}-${index}-${i}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="glass-strong flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-bold text-cyan-200">{t.name.slice(0, 1)}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{t.name}</p>
                <p className="truncate text-[11px] text-white/45">{t.handle}</p>
              </div>
              <span className="ml-auto flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />)}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">“{t.quote}”</p>
            <div className="mt-3"><GlassBadge tone="pink">♥ {t.genre}</GlassBadge></div>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-1.5">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Testimonial ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-7 bg-cyan-300" : "w-2.5 bg-white/25 hover:bg-white/50")} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- genre page feed helper ---------------- */
export function GenreFeed({ genreSlug, query }: { genreSlug?: string; query?: string }) {
  const endpoint = genreSlug ? `/api/trending?genre=${encodeURIComponent(genreSlug)}&limit=30` : query ? `/api/trending?query=${encodeURIComponent(query)}&limit=30` : "/api/trending?limit=30";
  return <Feed endpoint={endpoint} layout="list" showFilters />;
}
