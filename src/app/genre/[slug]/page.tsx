"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Radio } from "lucide-react";
import { Feed } from "@/components/Feed";
import { GlassBadge, SectionTitle } from "@/components/ui/Glass";
import { genreBySlug, GENRES } from "@/lib/catalog";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { radioApi, trendingApi } from "@/lib/api";
import Link from "next/link";

export default function GenrePage() {
  const params = useParams<{ slug: string }>();
  const genre = genreBySlug(String(params.slug || ""));
  const { toast } = useUi();

  if (!genre) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🌑</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">Genre not found in this galaxy</h1>
        <Link href="/explore" className="glass-btn glass-btn-primary mt-6 inline-flex !rounded-full px-5 py-2.5 text-sm">Back to explore</Link>
      </div>
    );
  }

  const startRadio = async () => {
    try {
      toast(`Tuning ${genre.name} radio…`, "info");
      const data = await radioApi({ genre: genre.name, artist: "", title: `${genre.name} mix` });
      const list = data.results || [];
      if (list.length) {
        usePlayer.getState().playContext(list, 0);
        toast(`${genre.name} radio live — ${list.length} tracks queued`, "success");
      }
    } catch {
      toast("Radio unavailable", "error");
    }
  };

  const playTop = async () => {
    try {
      const data = await trendingApi({ genre: genre.slug, limit: 25 });
      if (data.results?.length) usePlayer.getState().playContext(data.results, 0);
    } catch {
      toast("Could not start playback", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-10 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-7 sm:p-12">
        <span className="absolute inset-0 opacity-55" style={{ background: `linear-gradient(135deg, ${genre.from}, ${genre.to})` }} />
        <span className="animate-float absolute -right-8 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <span className="glass-strong flex h-24 w-24 items-center justify-center rounded-3xl text-5xl backdrop-blur-xl sm:h-32 sm:w-32 sm:text-6xl">{genre.icon}</span>
          <div className="min-w-0 flex-1">
            <GlassBadge tone="cyan">Genre</GlassBadge>
            <h1 className="mt-2 font-display text-4xl font-bold text-white drop-shadow sm:text-6xl">{genre.name}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">{genre.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={playTop} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold">
                <Play className="h-4 w-4 fill-white" /> Play top songs
              </button>
              <button onClick={startRadio} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm">
                <Radio className="h-4 w-4" /> Start {genre.name} radio
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <section>
        <SectionTitle eyebrow={`${genre.name} chart`} title={`Top ${genre.name} songs`} subtitle="Live feed, full-length playback, filter and sort however you like" />
        <Feed endpoint={`/api/trending?genre=${encodeURIComponent(genre.slug)}&limit=30`} layout="list" />
      </section>

      <section>
        <SectionTitle eyebrow="More to explore" title="Neighbouring galaxies" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {GENRES.filter((g) => g.slug !== genre.slug)
            .slice(0, 14)
            .map((g) => (
              <Link key={g.slug} href={`/genre/${g.slug}`} className="glass glass-card relative block w-40 shrink-0 overflow-hidden p-4">
                <span className="absolute inset-0 opacity-45" style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
                <span className="relative text-2xl">{g.icon}</span>
                <p className="relative mt-2 truncate font-display text-sm font-bold text-white">{g.name}</p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
