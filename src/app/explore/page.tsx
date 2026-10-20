"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { GenresGrid } from "@/components/HomeSections";
import { Feed } from "@/components/Feed";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { MOODS } from "@/lib/catalog";

export default function ExplorePage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-14 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute -right-10 -top-12 h-52 w-52 rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-600/30 blur-3xl" />
        <GlassBadge tone="cyan">Explore</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-5xl">
          <Compass className="h-8 w-8 text-cyan-200" /> Chart your course
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
          45+ genres, live global charts, mood-based mixes and new arrivals — every result is fully playable, full-length, and streams through the Calamify proxy.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/trending" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Global Top 50</Link>
          <Link href="/playlists" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Curated playlists</Link>
          <Link href="/artists" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Artists</Link>
          <Link href="/ncs" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎵 NCS · copyright free</Link>
          <Link href="/geometry-dash" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎮 Geometry Dash OST</Link>
          <Link href="/newgrounds" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎼 Newgrounds · 2M+ free tracks</Link>
          <Link href="/quran" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🕌 القرآن الكريم</Link>
          <Link href="/anime" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎌 Anime</Link>
          <Link href="/phonk" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🏎️ Phonk</Link>
          <Link href="/nasheed" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎶 أناشيد</Link>
          <Link href="/thefatrat" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎮 TheFatRat</Link>
          <Link href="/alan-walker" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🎧 Alan Walker & Marshmello</Link>
          <Link href="/undertale" className="glass-btn !rounded-full px-5 py-2.5 text-sm">❤️ Undertale OST</Link>
          <Link href="/living-tombstone" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🪦 The Living Tombstone</Link>
          <Link href="/fall-out-boy" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🖤 Fall Out Boy</Link>
          <Link href="/imagine-dragons" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🐉 Imagine Dragons</Link>
          <Link href="/skillet" className="glass-btn !rounded-full px-5 py-2.5 text-sm">🔥 Skillet</Link>
        </div>
      </motion.header>

      <GenresGrid limit={47} />

      <section id="moods">
        <SectionTitle eyebrow="Moods & activities" title="Pick a feeling" subtitle="Every mood opens a live, endlessly playable feed." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOODS.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.03 }}>
              <Link href={`/mix/mood-${m.name.toLowerCase()}`} className="glass glass-card relative block overflow-hidden p-5 text-left">
                <span className="absolute inset-0 opacity-40 transition group-hover:opacity-60" style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }} />
                <span className="relative block text-3xl">{m.icon}</span>
                <span className="relative mt-3 block font-display text-base font-bold text-white">{m.name}</span>
                <span className="relative mt-1 block text-[11px] text-white/55">{m.query}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Charts" title="Global Top 50" subtitle="The loudest signals in the universe right now." />
        <Feed endpoint="/api/trending?limit=50" layout="list" />
      </section>

      <section>
        <SectionTitle eyebrow="Fresh arrivals" title="New Releases" subtitle="Recently uploaded tracks across the index." />
        <Feed endpoint="/api/trending?query=new%20music%202026%20official%20audio&limit=24" layout="grid" showFilters={false} />
      </section>
    </div>
  );
}
