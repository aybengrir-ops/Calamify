"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Disc3, Download, Heart, History, Library as LibraryIcon, Plus, Users } from "lucide-react";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { usePlayer } from "@/store/player";

export default function LibraryPage() {
  const { user, likedSongs, playlists, artists, albums, history } = useSession();
  const { setCreatePlaylistOpen, setAuthOpen } = useUi();
  const playContext = usePlayer((s) => s.playContext);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-10 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute -right-10 -top-12 h-52 w-52 rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-600/25 blur-3xl" />
        <GlassBadge tone="cyan">Your library</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-5xl">
          <LibraryIcon className="h-8 w-8 text-cyan-200" /> {user ? `${user.displayName}'s Library` : "Your Library"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60">
          Everything you have collected in one gravity well. {user ? "Synced to your account across every device." : "You are browsing as a guest — likes are stored on this device. Sign in to sync."}
        </p>
        {!user && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setAuthOpen(true, "signup")} className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm font-semibold">Create free account</button>
            <button onClick={() => setAuthOpen(true, "login")} className="glass-btn !rounded-full px-5 py-2.5 text-sm">Sign in</button>
          </div>
        )}
      </motion.header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { href: "/liked", label: "Liked songs", count: likedSongs.length, icon: <Heart className="h-5 w-5 text-pink-300" /> },
          { href: "/playlists", label: "Playlists", count: playlists.length, icon: <Plus className="h-5 w-5 text-violet-300" /> },
          { href: "/artists", label: "Followed artists", count: artists.length, icon: <Users className="h-5 w-5 text-cyan-300" /> },
          { href: "/library#albums", label: "Saved albums", count: albums.length, icon: <Disc3 className="h-5 w-5 text-amber-300" /> },
          { href: "/downloads", label: "Downloads", count: 0, icon: <Download className="h-5 w-5 text-emerald-300" /> },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
            <Link href={card.href} className="glass glass-card block p-4">
              {card.icon}
              <p className="mt-3 font-display text-2xl font-bold text-white">{card.count}</p>
              <p className="text-[11.5px] text-white/55">{card.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <section>
        <SectionTitle eyebrow="Quick play" title="Liked songs" subtitle={`${likedSongs.length} tracks saved`} action={likedSongs.length ? <button onClick={() => playContext(likedSongs, 0)} className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Play all</button> : <Link href="/liked" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Open</Link>} />
        {likedSongs.length === 0 ? (
          <div className="glass-soft flex flex-col items-center gap-3 p-10 text-center">
            <span className="text-3xl">💜</span>
            <p className="max-w-sm text-sm text-white/55">Tap the heart on any track and it lands here instantly — even before you sign in.</p>
            <Link href="/trending" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Find something to love</Link>
          </div>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {likedSongs.slice(0, 12).map((s, i) => (
              <button key={`${s.id}-${i}`} onClick={() => playContext(likedSongs, i)} className="glass glass-card w-40 shrink-0 overflow-hidden p-3 text-left">
                <span className="block aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl">🎵</span>}
                </span>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-white">{s.title}</p>
                <p className="truncate text-[10.5px] text-white/50">{s.artist}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle eyebrow="Collections" title="Your playlists" action={<button onClick={() => (user ? setCreatePlaylistOpen(true) : setAuthOpen(true, "signup"))} className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2 text-xs"><Plus className="h-3.5 w-3.5" /> New playlist</button>} />
        {playlists.length === 0 ? (
          <p className="glass-soft p-6 text-sm text-white/55">No playlists yet. Use “Add to playlist” from any song menu to start one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {playlists.map((p, i) => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="glass glass-card flex items-center gap-3 p-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 text-xl" style={{ background: `linear-gradient(135deg, ${["#7b2ff7,#00d4ff", "#ff2e97,#ffd700", "#22c55e,#00d4ff"][i % 3]})` }}>🎶</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-white">{p.name}</span>
                  <span className="block text-[11px] text-white/50">{p.songCount} tracks · {p.isPublic ? "Public" : "Private"}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle eyebrow="Recently played" title="Listening history" action={<Link href="/history" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-2 text-xs"><History className="h-3.5 w-3.5" /> Full history</Link>} />
        {history.length === 0 ? (
          <p className="glass-soft p-6 text-sm text-white/55">Play a track and it will be logged here for instant replay.</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 6).map((h, i) => (
              <button key={`${h.song.id}-${i}`} onClick={() => playContext(history.map((x) => x.song), i)} className="glass-soft flex w-full items-center gap-3 p-2.5 text-left transition hover:border-cyan-300/40 hover:bg-white/10">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  {h.song.thumbnail && <img src={h.song.thumbnail} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-white">{h.song.title}</span>
                  <span className="block truncate text-[11px] text-white/50">{h.song.artist}</span>
                </span>
                <span className="text-[10.5px] text-white/35">{new Date(h.playedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section id="albums">
        <SectionTitle eyebrow="Saved" title="Albums in your library" />
        {albums.length === 0 ? (
          <p className="glass-soft flex items-center gap-3 p-6 text-sm text-white/55"><Bookmark className="h-4 w-4" /> Open any album page and hit “Save album” to shelf it here.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {albums.map((a) => (
              <Link key={a.albumKey} href={`/album/${encodeURIComponent(a.albumKey)}`} className="glass glass-card p-3">
                <span className="block aspect-square overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-700/40 to-cyan-500/30">
                  {a.coverUrl && <img src={a.coverUrl} alt="" className="h-full w-full object-cover" />}
                </span>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-white">{a.name}</p>
                <p className="truncate text-[10.5px] text-white/50">{a.artist}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
