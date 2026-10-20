"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Shuffle } from "lucide-react";
import { Feed } from "@/components/Feed";
import { GlassBadge } from "@/components/ui/Glass";
import { FEATURED_PLAYLISTS, MOODS, playlistBySlug } from "@/lib/catalog";
import { trendingApi } from "@/lib/api";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";

export default function MixPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || "");
  const { toast } = useUi();
  const curated = playlistBySlug(slug);
  const mood = MOODS.find((m) => slug === `mood-${m.name.toLowerCase()}`);

  const name = curated?.name || (mood ? `${mood.name} Mix` : slug.replace(/-/g, " "));
  const description = curated?.description || (mood ? `A live feed tuned to ${mood.name.toLowerCase()} frequencies.` : "A live, endlessly refreshed mix.");
  const query = curated?.query || (mood ? mood.query : name);
  const from = curated?.from || mood?.from || "#7b2ff7";
  const to = curated?.to || mood?.to || "#00d4ff";
  const icon = curated?.icon || mood?.icon || "🌌";

  const playAll = async () => {
    try {
      const data = await trendingApi({ query, limit: 30 });
      if (data.results?.length) usePlayer.getState().playContext(data.results, 0);
      else toast("Nothing queued yet — try again in a moment", "error");
    } catch {
      toast("Could not start the mix", "error");
    }
  };

  const shuffleAll = async () => {
    try {
      const data = await trendingApi({ query, limit: 30 });
      const list = [...(data.results || [])].sort(() => Math.random() - 0.5);
      if (list.length) {
        usePlayer.getState().setShuffle(true);
        usePlayer.getState().playContext(list, 0);
      }
    } catch {
      toast("Could not shuffle the mix", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-7 sm:p-10">
        <span className="absolute inset-0 opacity-55" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
        <span className="animate-float absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end">
          <span className="glass-strong flex h-28 w-28 items-center justify-center rounded-3xl text-5xl backdrop-blur-xl">{icon}</span>
          <div className="min-w-0 flex-1">
            <GlassBadge tone="gold">{curated ? "Curated playlist" : "Live mix"}</GlassBadge>
            <h1 className="mt-2 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">{name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">{description}</p>
            <p className="mt-1 text-[11.5px] text-white/55">By {curated?.creator || "Calamify Cosmic"} · refreshed live · full-length streams</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={playAll} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold"><Play className="h-4 w-4 fill-white" /> Play all</button>
              <button onClick={shuffleAll} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Shuffle className="h-4 w-4" /> Shuffle</button>
            </div>
          </div>
        </div>
      </motion.header>

      <Feed endpoint={`/api/trending?query=${encodeURIComponent(query)}&limit=30`} layout="list" />

      <section>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200/70">More mixes</p>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {FEATURED_PLAYLISTS.filter((p) => p.slug !== slug).map((p) => (
            <Link key={p.slug} href={`/mix/${p.slug}`} className="glass glass-card relative w-44 shrink-0 overflow-hidden p-4">
              <span className="absolute inset-0 opacity-45" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
              <span className="relative text-2xl">{p.icon}</span>
              <p className="relative mt-2 truncate font-display text-sm font-bold text-white">{p.name}</p>
              <p className="relative truncate text-[10.5px] text-white/60">{p.creator}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
