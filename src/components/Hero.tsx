"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Compass, Play } from "lucide-react";
import { usePlayer } from "@/store/player";
import { trendingApi } from "@/lib/api";
import type { Song } from "@/lib/types";

const PHRASES = ["Explore the Universe of Copyright-Free Music", "Every Song. Every Star.", "Full-Length. Zero Limits."];

export function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  // render the full headline first (no empty H1 flash), then start the typewriter loop
  const [typed, setTyped] = useState(PHRASES[0]);
  const playContext = usePlayer((s) => s.playContext);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const full = PHRASES[phraseIndex];
    let cancelled = false;
    let interval = 0;
    // First paint shows the complete headline; then it types itself out.
    const begin = window.setTimeout(() => {
      if (cancelled) return;
      let i = 0;
      setTyped("");
      interval = window.setInterval(() => {
        if (cancelled) return;
        i += 1;
        setTyped(full.slice(0, i));
        if (i >= full.length) {
          window.clearInterval(interval);
          window.setTimeout(() => !cancelled && setPhraseIndex((p) => (p + 1) % PHRASES.length), 3600);
        }
      }, 42);
    }, phraseIndex === 0 ? 2800 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(begin);
      if (interval) window.clearInterval(interval);
    };
  }, [phraseIndex]);

  useEffect(() => {
    let alive = true;
    trendingApi({ limit: 12 })
      .then((d) => alive && setSongs(d.results || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pt-28 pb-20">
      {/* orbiting planets */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="animate-orbit absolute h-[520px] w-[520px] rounded-full border border-white/10 sm:h-[720px] sm:w-[720px]" />
        <div className="animate-orbit absolute h-[720px] w-[720px] rounded-full border border-white/[0.07] sm:h-[1000px] sm:w-[1000px]" style={{ animationDuration: "52s", animationDirection: "reverse" }} />
        <motion.span className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-400 via-violet-500 to-indigo-700 shadow-[0_0_60px_rgba(123,47,247,0.85)]" style={{ top: "18%", left: "12%" }} animate={{ y: [0, -22, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span className="absolute h-9 w-9 rounded-full bg-gradient-to-br from-cyan-200 to-cyan-500 shadow-[0_0_40px_rgba(0,212,255,0.8)]" style={{ top: "62%", right: "14%" }} animate={{ y: [0, 18, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span className="absolute h-5 w-5 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_28px_rgba(255,215,0,0.75)]" style={{ bottom: "18%", left: "24%" }} animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-6 flex justify-center">
          <span className="glass-badge px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">🌌 Full-length streams · No previews · No ads</span>
        </motion.div>

        <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl">
          <span className="text-gradient">{typed}</span>
          <span className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] animate-pulse bg-cyan-300 align-middle" />
        </h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          <span className="font-semibold text-white">Kol l-Musica dyal l-Kawn. Bla 7doud.</span> — All the music of the universe, without limits. Search any song that exists, press play, and hear it all the way to the last second.
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.8 }} className="mt-3 text-[12px] uppercase tracking-[0.22em] text-white/40 sm:text-[13px]">
          YouTube · Newgrounds · NCS · Quran · Anime · Phonk — ga3 f blaça wa7da
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              if (songs.length) playContext(songs, 0);
              else window.location.href = "/trending";
            }}
            className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-7 py-3.5 text-sm font-semibold sm:text-base"
          >
            <Play className="h-4 w-4 fill-white" /> Start Listening
          </button>
          <Link href="/explore" className="glass-btn flex items-center gap-2 !rounded-full px-7 py-3.5 text-sm font-semibold sm:text-base">
            <Compass className="h-4 w-4" /> Explore Genres
          </Link>
        </motion.div>

        {/* vinyl / waveform animation */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.9 }} className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-3">
          <div className="glass-strong relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full sm:h-28 sm:w-28">
            <div className="animate-vinyl absolute inset-2 rounded-full border border-white/15 bg-[conic-gradient(from_0deg,rgba(255,255,255,0.14),rgba(0,212,255,0.18),rgba(123,47,247,0.2),rgba(255,255,255,0.14))]" />
            <div className="absolute inset-[38%] rounded-full bg-[#0a0a1a] ring-1 ring-white/25" />
            <div className="absolute inset-[46%] rounded-full bg-cyan-300/70" />
          </div>
          <div className="flex h-24 flex-1 items-end gap-[3px] sm:h-28">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="eq-bar flex-1 rounded-full bg-gradient-to-t from-violet-500/70 via-cyan-400/70 to-pink-400/70"
                style={{ height: `${18 + Math.abs(Math.sin(i * 0.7)) * 78}%`, animationDelay: `${(i % 10) * 0.11}s`, animationDuration: `${0.9 + (i % 5) * 0.16}s` }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-14 flex justify-center">
          <a href="#genres" aria-label="Scroll to genres" className="glass-btn flex h-11 w-11 animate-bounce-soft items-center justify-center rounded-full !px-0">
            <ChevronDown className="h-5 w-5 text-cyan-200" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
