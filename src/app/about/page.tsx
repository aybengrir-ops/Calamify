"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Radio, ShieldCheck, Sparkles, Waves, Zap } from "lucide-react";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";

const PILLARS = [
  { icon: <Waves className="h-5 w-5" />, title: "Full-length, always", body: "No 30-second previews. Tracks stream from the first sample to the final fade-out — 3 minutes or 13, whatever the real duration is." },
  { icon: <Zap className="h-5 w-5" />, title: "Instant start", body: "The top three results are warmed in the background while you browse, and an 8-second watchdog re-routes the stream if anything stalls." },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Zero CORS drama", body: "Your browser only ever talks to calamify.com/api/audio. Our server fetches upstream and pipes the bytes through, so nothing is blocked." },
  { icon: <Cpu className="h-5 w-5" />, title: "Innertube only", body: "youtubei.js speaks YouTube's own internal API — the same one the mobile app uses. No yt-dlp, no Piped, no Invidious to break next week." },
  { icon: <Radio className="h-5 w-5" />, title: "Endless radio", body: "Seed a radio from any song, artist or genre and Calamify keeps queuing similar tracks seamlessly." },
  { icon: <Sparkles className="h-5 w-5" />, title: "Installable PWA", body: "Add Calamify to your home screen on iOS or Android, download tracks for offline listening, and control playback from the lock screen." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-14 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-7 text-center sm:p-12">
        <span className="animate-float absolute -left-16 -top-16 h-60 w-60 rounded-full bg-gradient-to-br from-violet-600/35 to-cyan-400/25 blur-3xl" />
        <span className="animate-float absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-gradient-to-br from-pink-500/25 to-amber-400/20 blur-3xl" style={{ animationDelay: "2.5s" }} />
        <GlassBadge tone="cyan">About</GlassBadge>
        <h1 className="relative mt-4 font-display text-4xl font-bold text-white sm:text-6xl">
          <span className="text-gradient">Calamify</span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/65">
          A real streaming platform, not a mockup. Search anything that exists, press play, and hear the whole song through your speakers — wrapped in the most beautiful space-themed glass interface we could build.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/explore" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Start exploring</Link>
          <Link href="/trending" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Global Top 50</Link>
        </div>
      </motion.header>

      <section id="engine">
        <SectionTitle eyebrow="How it works" title="The audio engine" subtitle="Browser → Calamify server → upstream provider. Never the other way around." />
        <div className="glass-strong space-y-4 p-6">
          <pre className="no-scrollbar overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-[11.5px] leading-relaxed text-cyan-100/80">{`User's browser
   │   audio.src = "https://calamify.com/api/audio/{songId}"
   ▼
Calamify backend (Node.js + youtubei.js)
   │   1. Innertube.getInfo(videoId)
   │   2. chooseFormat({ type: 'audio', quality: 'best' })
   │   3. format.decipher(session.player)
   │   4. fetch the stream SERVER-SIDE (sequential chunks)
   │   5. cache to disk, then pipe ranged bytes back
   ▼
Upstream media servers
   ✅ full length · ✅ no CORS · ✅ seekable · ✅ no previews`}</pre>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Primary catalog", value: "Innertube (youtubei.js)" },
              { label: "Full-length backbone", value: "Audius open API" },
              { label: "Lyrics", value: "lrclib.net (synced LRC)" },
            ].map((row) => (
              <div key={row.label} className="glass-soft p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">{row.label}</p>
                <p className="mt-1.5 text-sm font-semibold text-white">{row.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] leading-relaxed text-white/55">
            Every request goes through <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-100">/api/audio/&#123;songId&#123;</code>. If an upstream refuses to hand over the complete file (some networks throttle cloud IPs), the engine automatically re-routes to a full-length match from the Audius backbone — and if that fails too, the player skips ahead instead of spinning forever.
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Principles" title="What we refuse to compromise on" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.05 }} className="glass glass-card p-5">
              <span className="glass-btn flex h-10 w-10 items-center justify-center rounded-xl !px-0 text-cyan-200">{p.icon}</span>
              <h3 className="mt-3 font-display text-base font-bold text-white">{p.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="sources" className="space-y-6">
        <SectionTitle eyebrow="Credits" title="Sources & stack" />
        <div className="glass-strong grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-violet-200/80">Frontend</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-white/65">
              <li>Next.js App Router + React 19 + TypeScript</li>
              <li>Tailwind CSS v4 with a custom glass design system</li>
              <li>Framer Motion, GSAP ScrollTrigger, Lenis smooth scroll</li>
              <li>Zustand stores for player, session and UI state</li>
              <li>Web Audio AnalyserNode visualizer + Media Session API</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200/80">Backend</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-white/65">
              <li>Next.js route handlers (Node runtime) as the audio proxy</li>
              <li>youtubei.js (Innertube) for search + full-length audio</li>
              <li>Audius open API as the guaranteed full-length backbone</li>
              <li>PostgreSQL + Drizzle ORM for the library and accounts</li>
              <li>Service Worker + Web App Manifest for offline PWA install</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="privacy" className="grid gap-4 sm:grid-cols-2">
        <div className="glass p-5">
          <h3 className="font-display text-base font-bold text-white">Privacy</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
            Accounts are stored in your own PostgreSQL instance with bcrypt-hashed passwords and signed session cookies. Listening history, likes and playlists never leave your database. Guests keep everything in local storage only.
          </p>
        </div>
        <div id="terms" className="glass p-5">
          <h3 className="font-display text-base font-bold text-white">Terms of orbit</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
            Calamify streams audio that upstream providers make available and does not host copyrighted media itself. Respect the artists: buy the records, go to the shows, and keep the volume reasonable for your crew.
          </p>
        </div>
        <div id="community" className="glass p-5">
          <h3 className="font-display text-base font-bold text-white">Community</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
            Share playlists with a link, follow artists together and keep the comments kind. The galaxy is big enough for every taste.
          </p>
        </div>
        <div id="contact" className="glass p-5">
          <h3 className="font-display text-base font-bold text-white">Contact</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
            Signal the crew at <span className="text-cyan-200">crew@calamify.space</span> — bug reports, playlist pitches and interstellar mixtapes welcome.
          </p>
        </div>
      </section>
    </div>
  );
}
