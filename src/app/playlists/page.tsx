"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ListMusic, Plus, Lock, Globe2, Music2 } from "lucide-react";
import { FEATURED_PLAYLISTS } from "@/lib/catalog";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";

export default function PlaylistsPage() {
  const { playlists, user } = useSession();
  const { setCreatePlaylistOpen, setAuthOpen } = useUi();

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-12 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute -right-12 -top-12 h-52 w-52 rounded-full bg-gradient-to-br from-violet-500/35 to-cyan-400/25 blur-3xl" />
        <GlassBadge tone="purple">Playlists</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-5xl">
          <ListMusic className="h-8 w-8 text-violet-200" /> Curated Cosmic Playlists
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
          Eight hand-built collections from the Calamify crew, plus every playlist you create. Drag to reorder, share with a link, and take them offline.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => (user ? setCreatePlaylistOpen(true) : setAuthOpen(true, "signup"))} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold">
            <Plus className="h-4 w-4" /> New playlist
          </button>
          <Link href="/liked" className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm">Liked songs</Link>
        </div>
      </motion.header>

      <section>
        <SectionTitle eyebrow="Your collection" title={user ? `${user.displayName}'s playlists` : "Your playlists"} subtitle={playlists.length ? `${playlists.length} playlists · synced to your account` : "Sign in to create and sync playlists across devices"} />
        {playlists.length === 0 ? (
          <div className="glass-soft flex flex-col items-center gap-3 p-10 text-center">
            <span className="text-3xl">🪐</span>
            <p className="max-w-sm text-sm text-white/55">No playlists yet. Create one from any song&apos;s “…” menu, or start with a name below.</p>
            <button onClick={() => (user ? setCreatePlaylistOpen(true) : setAuthOpen(true, "signup"))} className="glass-btn glass-btn-primary px-5 py-2.5 text-sm font-semibold">
              {user ? "Create playlist" : "Sign in to create"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {playlists.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.04 }}>
                <Link href={`/playlist/${p.id}`} className="glass glass-card group block overflow-hidden">
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${["#7b2ff7,#00d4ff", "#ff2e97,#ffd700", "#22c55e,#00d4ff", "#312e81,#ff2e97"][i % 4]})` }}>
                    {p.coverUrl ? <img src={p.coverUrl} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-12 w-12 text-white/70" />}
                    <span className="absolute right-2 top-2">{p.isPublic ? <Globe2 className="h-4 w-4 text-white/70" /> : <Lock className="h-4 w-4 text-white/70" />}</span>
                  </div>
                  <div className="p-4">
                    <p className="truncate font-display text-base font-bold text-white">{p.name}</p>
                    <p className="mt-1 line-clamp-2 text-[11.5px] text-white/55">{p.description || "No description"}</p>
                    <p className="mt-2 text-[10.5px] text-white/40">{p.songCount} tracks</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle eyebrow="By the crew" title="Featured collections" subtitle="Tap any cover to open a live, full-length feed" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PLAYLISTS.map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.04 }}>
              <Link href={`/mix/${p.slug}`} className="glass glass-card group relative block overflow-hidden p-5">
                <span className="absolute inset-0 opacity-50 transition group-hover:opacity-75" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
                <span className="relative block text-4xl">{p.icon}</span>
                <p className="relative mt-3 font-display text-lg font-bold text-white">{p.name}</p>
                <p className="relative mt-1 line-clamp-2 text-[12px] text-white/70">{p.description}</p>
                <span className="glass-badge relative mt-3 inline-block px-2.5 py-1 text-[10px] text-white/80">{p.creator}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
