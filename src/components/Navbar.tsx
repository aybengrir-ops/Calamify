"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Bell, ChevronDown, Dice5, LogOut, Menu, Mic, Play, Search, Settings, User, X, Library, Heart } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { searchApi } from "@/lib/api";
import { GENRES, FEATURED_PLAYLISTS, TRENDING_SEARCHES } from "@/lib/catalog";
import type { Song } from "@/lib/types";
import { warmList } from "@/lib/preloader";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/trending", label: "Trending" },
  { href: "/playlists", label: "Playlists" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
];

export function PlanetMark({ size = 26 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 via-cyan-300 to-fuchsia-500 shadow-[0_0_18px_rgba(123,47,247,0.85)]" />
      <span className="absolute inset-[22%] rounded-full bg-[#0a0a1a]/70 backdrop-blur-[2px]" />
      <span className="animate-orbit absolute inset-[-38%] rounded-full border border-cyan-200/50" style={{ transform: "rotate(-22deg)" }} />
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, notifications, searches, recordSearch, logout, markNotificationsRead } = useSession();
  const { setAuthOpen, mobileNav, setMobileNav, notificationsOpen, setNotificationsOpen, toast } = useUi();
  const playSong = usePlayer((s) => s.playSong);

  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const debounce = useRef<number | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
      setUserMenu(false);
      setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // search-as-you-type (debounced 300ms)
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = window.setTimeout(async () => {
      try {
        const data = await searchApi(q, 8);
        setResults(data.results.slice(0, 8));
        setSuggestions(data.suggestions.slice(0, 5));
        warmList(data.results, 3);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [query]);

  const artists = useMemo(() => [...new Set(results.map((r) => r.artist))].slice(0, 3), [results]);
  const genres = useMemo(() => GENRES.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3), [query]);
  const playlists = useMemo(() => FEATURED_PLAYLISTS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3), [query]);

  const submit = (q?: string) => {
    const value = (q ?? query).trim();
    if (!value) return;
    recordSearch(value);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const lucky = async () => {
    const pick = TRENDING_SEARCHES[Math.floor(Math.random() * TRENDING_SEARCHES.length)];
    setQuery(pick);
    try {
      const data = await searchApi(pick, 6);
      if (data.results.length) {
        const song = data.results[Math.floor(Math.random() * Math.min(4, data.results.length))];
        playSong(song, data.results);
        toast(`Feeling lucky 🍀 "${song.title}"`, "success");
        return;
      }
    } catch {
      /* fall through */
    }
    submit(pick);
  };

  const voiceSearch = () => {
    const W = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Recognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Recognition) {
      toast("Voice search is not supported in this browser", "error");
      return;
    }
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      setQuery(text);
      submit(text);
    };
    rec.onerror = () => toast("Could not hear you — try typing instead", "error");
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-1.5" : "py-3"
        )}
      >
        <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5">
          <nav
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-3 py-2 transition-all duration-500 sm:gap-4 sm:px-4",
              scrolled
                ? "border-white/15 bg-[#0a0a1a]/75 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
                : "border-white/10 bg-white/[0.05] backdrop-blur-xl"
            )}
          >
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              <PlanetMark size={scrolled ? 22 : 26} />
              <span className="logo-glow text-gradient hidden font-display text-lg font-bold tracking-tight sm:block sm:text-xl">Calamify</span>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-300",
                    pathname === l.href ? "text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  {pathname === l.href && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl border border-cyan-300/30 bg-white/10 shadow-[0_0_18px_-6px_rgba(0,212,255,0.9)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <span className="relative">{l.label}</span>
                </Link>
              ))}
            </div>

            {/* universal search */}
            <div ref={boxRef} className="relative ml-auto w-full max-w-[520px] flex-1">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                      if (e.key === "Escape") setOpen(false);
                    }}
                    placeholder="Search any song, artist or album in the universe…"
                    aria-label="Search music"
                    className="glass-input w-full !rounded-xl py-2.5 pl-10 pr-9 text-[13px]"
                  />
                  {loading && <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-200" />}
                  {!loading && query && (
                    <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Link href="/recognize" onClick={() => setOpen(false)} aria-label="Recognize a song" title="Recognize a song from a clip" className="glass-btn hidden h-10 w-10 items-center justify-center rounded-xl !px-0 sm:flex">
                  <AudioLines className="h-4 w-4" />
                </Link>
                <button onClick={voiceSearch} aria-label="Voice search" title="Voice search" className={cn("glass-btn hidden h-10 w-10 items-center justify-center rounded-xl !px-0 sm:flex", listening && "border-pink-300/70 text-pink-200 animate-pulse-ring")}>
                  <Mic className="h-4 w-4" />
                </button>
                <button onClick={lucky} aria-label="I'm feeling lucky" title="I'm feeling lucky" className="glass-btn hidden h-10 w-10 items-center justify-center rounded-xl !px-0 md:flex">
                  <Dice5 className="h-4 w-4" />
                </button>
              </div>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="glass-strong absolute inset-x-0 top-[calc(100%+10px)] max-h-[70vh] overflow-y-auto p-3"
                  >
                    {!query.trim() ? (
                      <div className="space-y-3">
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">Trending searches</p>
                          <div className="flex flex-wrap gap-2">
                            {TRENDING_SEARCHES.map((t) => (
                              <button key={t} onClick={() => submit(t)} className="glass-badge px-3 py-1.5 text-white/80 transition hover:border-cyan-300/50 hover:text-white">
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        {searches.length > 0 && (
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/80">Recent</p>
                            <div className="flex flex-wrap gap-2">
                              {searches.slice(0, 6).map((t) => (
                                <button key={t} onClick={() => submit(t)} className="glass-badge px-3 py-1.5 text-white/70 transition hover:border-violet-300/50 hover:text-white">
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-pink-300/80">Browse genres</p>
                          <div className="flex flex-wrap gap-2">
                            {GENRES.slice(0, 10).map((g) => (
                              <Link key={g.slug} href={`/genre/${g.slug}`} onClick={() => setOpen(false)} className="glass-badge px-3 py-1.5 text-white/70 transition hover:border-pink-300/50 hover:text-white">
                                {g.icon} {g.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {results.length > 0 && (
                          <section>
                            <p className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">
                              <span>🎵 Songs</span>
                              <button onClick={() => submit()} className="text-[10px] normal-case tracking-normal text-white/50 hover:text-white">
                                See all results
                              </button>
                            </p>
                            <div className="space-y-1">
                              {results.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    playSong(s, results);
                                    setOpen(false);
                                  }}
                                  className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
                                >
                                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/5">
                                    {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-full w-full object-cover" /> : null}
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                      <Play className="h-4 w-4 fill-white text-white" />
                                    </span>
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-medium text-white">{s.title}</span>
                                    <span className="block truncate text-[11px] text-white/55">{s.artist}</span>
                                  </span>
                                  <span className={cn("glass-badge px-2 py-0.5 text-[9px]", s.source === "audius" ? "text-cyan-200" : "text-white/60")}>{s.source === "audius" ? "full stream" : "innertube"}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        )}

                        {artists.length > 0 && (
                          <section>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/80">🎤 Artists</p>
                            <div className="flex flex-wrap gap-2">
                              {artists.map((a) => (
                                <Link key={a} href={`/artist/${encodeURIComponent(a)}`} onClick={() => setOpen(false)} className="glass-btn flex items-center gap-2 !rounded-full px-3 py-1.5 text-xs">
                                  <User className="h-3.5 w-3.5" /> {a}
                                </Link>
                              ))}
                            </div>
                          </section>
                        )}

                        {playlists.length > 0 && (
                          <section>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-pink-300/80">📂 Playlists</p>
                            <div className="flex flex-wrap gap-2">
                              {playlists.map((p) => (
                                <Link key={p.slug} href={`/mix/${p.slug}`} onClick={() => setOpen(false)} className="glass-btn !rounded-full px-3 py-1.5 text-xs">
                                  {p.icon} {p.name}
                                </Link>
                              ))}
                            </div>
                          </section>
                        )}

                        {genres.length > 0 && (
                          <section>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/80">🏷️ Genres</p>
                            <div className="flex flex-wrap gap-2">
                              {genres.map((g) => (
                                <Link key={g.slug} href={`/genre/${g.slug}`} onClick={() => setOpen(false)} className="glass-btn !rounded-full px-3 py-1.5 text-xs">
                                  {g.icon} {g.name}
                                </Link>
                              ))}
                            </div>
                          </section>
                        )}

                        {suggestions.length > 0 && (
                          <section>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Did you mean</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((s) => (
                                <button key={s} onClick={() => submit(s)} className="glass-badge px-3 py-1.5 text-white/70 hover:text-white">
                                  {s}
                                </button>
                              ))}
                            </div>
                          </section>
                        )}

                        {!loading && !results.length && (
                          <p className="py-6 text-center text-sm text-white/50">No results for “{query}”. Press enter to search the whole universe.</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* notifications */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen && unread) void markNotificationsRead();
                }}
                aria-label="Notifications"
                className="glass-btn relative flex h-10 w-10 items-center justify-center rounded-xl !px-0"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 px-1 text-[9px] font-bold text-white shadow-[0_0_12px_rgba(255,46,151,0.9)]">{unread}</span>}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass-strong absolute right-0 top-[calc(100%+10px)] w-80 p-3">
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">Notifications</p>
                    {notifications.length === 0 ? (
                      <p className="px-1 py-6 text-center text-sm text-white/50">All quiet in the void ✨</p>
                    ) : (
                      <div className="max-h-72 space-y-1.5 overflow-y-auto">
                        {notifications.slice(0, 12).map((n) => (
                          <Link key={n.id} href={n.link || "#"} onClick={() => setNotificationsOpen(false)} className="block rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:border-cyan-300/40 hover:bg-white/10">
                            <p className="text-[12px] font-semibold text-white">{n.title}</p>
                            {n.body && <p className="mt-0.5 text-[11px] leading-snug text-white/55">{n.body}</p>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* auth / account */}
            {user ? (
              <div className="relative hidden sm:block">
                <button onClick={() => setUserMenu((v) => !v)} className="glass-btn flex items-center gap-2 !rounded-xl px-2.5 py-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full border border-white/25 object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-[11px] font-bold text-white">{user.displayName.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="max-w-24 truncate text-xs font-medium">{user.displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass-strong absolute right-0 top-[calc(100%+10px)] w-52 overflow-hidden p-1.5">
                      {[
                        { href: "/profile", label: "Your profile", icon: <User className="h-4 w-4" /> },
                        { href: "/library", label: "Your library", icon: <Library className="h-4 w-4" /> },
                        { href: "/liked", label: "Liked songs", icon: <Heart className="h-4 w-4" /> },
                        { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white/75 transition hover:bg-white/10 hover:text-white">
                          {item.icon} {item.label}
                        </Link>
                      ))}
                      <button onClick={() => { void logout(); setUserMenu(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-pink-200/80 transition hover:bg-pink-500/15 hover:text-pink-100">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <button onClick={() => setAuthOpen(true, "login")} className="glass-btn px-3.5 py-2 text-xs font-medium">
                  Sign in
                </button>
                <button onClick={() => setAuthOpen(true, "signup")} className="glass-btn glass-btn-primary px-3.5 py-2 text-xs font-semibold">
                  Sign up
                </button>
              </div>
            )}

            <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="glass-btn flex h-10 w-10 items-center justify-center rounded-xl !px-0 lg:hidden">
              <Menu className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="glass-strong fixed right-0 top-0 z-[61] flex h-full w-[82%] max-w-xs flex-col gap-4 overflow-y-auto p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-lg font-bold">
                  <PlanetMark size={22} /> <span className="text-gradient">Calamify</span>
                </span>
                <button onClick={() => setMobileNav(false)} aria-label="Close menu" className="glass-btn flex h-9 w-9 items-center justify-center rounded-xl !px-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileNav(false)} className={cn("block rounded-xl px-3 py-2.5 text-sm font-medium transition", pathname === l.href ? "border border-cyan-300/30 bg-white/10 text-white" : "text-white/70 hover:bg-white/5")}>
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-1 border-t border-white/10 pt-3">
                <Link href="/ncs" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎵 NCS (copyright free)</Link>
                <Link href="/geometry-dash" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎮 Geometry Dash OST</Link>
                <Link href="/newgrounds" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎼 Newgrounds Universe</Link>
                <Link href="/quran" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🕌 القرآن الكريم</Link>
                <Link href="/phonk" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🏎️ Phonk & Hardcore</Link>
                <Link href="/anime" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎌 Anime OP · ED · OST</Link>
                <Link href="/nasheed" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎶 أناشيد و أشعار</Link>
                <Link href="/thefatrat" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎮 TheFatRat — 36 tracks</Link>
                <Link href="/alan-walker" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🎧 Alan Walker & Marshmello</Link>
                <Link href="/undertale" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">❤️ Undertale OST (Toby Fox)</Link>
                <Link href="/living-tombstone" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🪦 The Living Tombstone</Link>
                <Link href="/fall-out-boy" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🖤 Fall Out Boy</Link>
                <Link href="/imagine-dragons" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🐉 Imagine Dragons</Link>
                <Link href="/skillet" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">🔥 Skillet</Link>
                <Link href="/library" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">Your library</Link>
                <Link href="/liked" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">Liked songs</Link>
                <Link href="/settings" onClick={() => setMobileNav(false)} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5">Settings</Link>
              </div>
              {user ? (
                <button onClick={() => { void logout(); setMobileNav(false); }} className="glass-btn mt-auto py-2.5 text-sm">Sign out ({user.displayName})</button>
              ) : (
                <div className="mt-auto space-y-2">
                  <button onClick={() => { setAuthOpen(true, "signup"); setMobileNav(false); }} className="glass-btn glass-btn-primary w-full py-2.5 text-sm font-semibold">Create account</button>
                  <button onClick={() => { setAuthOpen(true, "login"); setMobileNav(false); }} className="glass-btn w-full py-2.5 text-sm">Sign in</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
