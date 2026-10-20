"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Feed } from "@/components/Feed";
import { GlassBadge, SectionTitle } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";

const SCOPES = [
  { key: "global", label: "🌍 Global", query: "top hits global chart" },
  { key: "us", label: "🇺🇸 United States", query: "top songs united states billboard" },
  { key: "uk", label: "🇬🇧 United Kingdom", query: "uk top 40 hits" },
  { key: "in", label: "🇮🇳 India", query: "bollywood trending songs" },
  { key: "jp", label: "🇯🇵 Japan", query: "jpop trending hits" },
  { key: "kr", label: "🇰🇷 Korea", query: "kpop trending hits" },
  { key: "ng", label: "🇳🇬 Nigeria", query: "afrobeats trending" },
  { key: "br", label: "🇧🇷 Brazil", query: "brasil funk sertanejo hits" },
  { key: "viral", label: "🚀 Viral", query: "viral tiktok songs trending" },
  { key: "electronic", label: "⚡ Electronic", query: "electronic dance trending" },
];

export default function TrendingPage() {
  const [scope, setScope] = useState(SCOPES[0]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute -left-10 -bottom-14 h-56 w-56 rounded-full bg-gradient-to-br from-pink-500/30 to-amber-400/25 blur-3xl" />
        <GlassBadge tone="pink">Live charts</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-5xl">
          <Flame className="h-8 w-8 text-pink-300" /> What&apos;s Orbiting Right Now
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">Real-time trending feeds by country, genre and virality. Every track plays full-length the moment you press play.</p>
      </motion.header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SCOPES.map((s) => (
          <button key={s.key} onClick={() => setScope(s)} className={cn("glass-btn shrink-0 !rounded-full px-4 py-2 text-xs", scope.key === s.key && "glass-btn-primary font-semibold")}>
            {s.label}
          </button>
        ))}
      </div>

      <section>
        <SectionTitle eyebrow={scope.label} title={`${scope.label.replace(/^[^\s]+\s/, "")} Top 50`} subtitle="Auto-refreshed from the live index" />
        <Feed key={scope.key} endpoint={`/api/trending?query=${encodeURIComponent(scope.query)}&limit=50`} layout="list" />
      </section>
    </div>
  );
}
