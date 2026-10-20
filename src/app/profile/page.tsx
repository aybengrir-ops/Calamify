"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock3, Flame, Heart, ListMusic, PieChart, Save, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { GlassBadge, GlassButton, GlassInput, GlassToggle } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { GENRES } from "@/lib/catalog";
import { cn } from "@/lib/cn";

interface Stats {
  hours: number;
  minutes: number;
  plays: number;
  likes: number;
  playlists: number;
  streak: number;
  topArtists: { name: string; plays: number }[];
  topSongs: { id: string; title: string; artist: string; plays: number; thumbnail: string }[];
  genres: { name: string; plays: number }[];
  lastPlayed: string | null;
}

const AVATARS = ["🧑‍🚀", "👽", "🛰️", "🌌", "🪐", "☄️", "🌠", "🚀", "🌙", "⭐", "🔭", "🎧"];

export default function ProfilePage() {
  const { user, settings, updateSettings, likedSongs, playlists } = useSession();
  const { setAuthOpen, toast } = useUi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || "🧑‍🚀");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user?.favoriteGenres || []);
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || "");
      setAvatarSeed(user.avatarSeed || "🧑‍🚀");
      setFavoriteGenres(user.favoriteGenres || []);
      setIsPublic(user.isPublic);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api<{ stats: Stats }>("/api/stats").then((d) => setStats(d.stats)).catch(() => undefined);
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-5xl">🧑‍🚀</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-white">Your profile is waiting</h1>
        <p className="mt-2 text-sm text-white/60">Sign in to see listening stats, streaks, top artists and your genre fingerprint.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setAuthOpen(true, "login")} className="glass-btn !rounded-full px-5 py-2.5 text-sm">Sign in</button>
          <button onClick={() => setAuthOpen(true, "signup")} className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Create account</button>
        </div>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    await updateSettings({ displayName, bio, avatarSeed, favoriteGenres, isPublic });
    await useSession.getState().refresh();
    setSaving(false);
    toast("Profile updated", "success");
  };

  const genreTotal = stats?.genres.reduce((a, b) => a + b.plays, 0) || 1;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        <span className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg,#7b2ff7,#00d4ff,#ff2e97)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/65 to-transparent" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="glass-strong flex h-24 w-24 items-center justify-center rounded-full text-4xl backdrop-blur-xl">{avatarSeed.length <= 2 ? avatarSeed : user.displayName.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <GlassBadge tone="gold">@{user.username}</GlassBadge>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{user.displayName}</h1>
            <p className="mt-1 text-sm text-white/60">{user.bio || "No bio yet — tell the galaxy who you are."}</p>
            <p className="mt-1 text-[11.5px] text-white/45">Orbiting since {new Date(user.createdAt).toLocaleDateString()} · {user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/liked" className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2 text-xs"><Heart className="h-3.5 w-3.5" /> {likedSongs.length} liked</Link>
            <Link href="/playlists" className="glass-btn flex items-center gap-2 !rounded-full px-4 py-2 text-xs"><ListMusic className="h-3.5 w-3.5" /> {playlists.length} playlists</Link>
            <Link href="/settings" className="glass-btn !rounded-full px-4 py-2 text-xs">Settings</Link>
          </div>
        </div>
      </motion.header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Clock3 className="h-5 w-5 text-cyan-200" />, value: `${stats?.hours ?? 0}h`, label: "Listening time" },
          { icon: <Trophy className="h-5 w-5 text-amber-200" />, value: stats?.plays ?? 0, label: "Total plays" },
          { icon: <Flame className="h-5 w-5 text-pink-200" />, value: `${stats?.streak ?? 0}d`, label: "Current streak" },
          { icon: <PieChart className="h-5 w-5 text-violet-200" />, value: stats?.genres.length ?? 0, label: "Genres explored" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} className="glass glass-card p-4">
            {s.icon}
            <p className="mt-2 font-display text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-5">
          <h2 className="font-display text-lg font-bold text-white">Top 5 artists</h2>
          {stats?.topArtists.length ? (
            <ol className="mt-3 space-y-2">
              {stats.topArtists.map((a, i) => (
                <li key={a.name} className="glass-soft flex items-center gap-3 p-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/70 to-cyan-400/60 text-[11px] font-bold text-white">{i + 1}</span>
                  <Link href={`/artist/${encodeURIComponent(a.name)}`} className="min-w-0 flex-1 truncate text-[13px] text-white hover:text-cyan-200">{a.name}</Link>
                  <span className="text-[11px] text-white/40">{a.plays} plays</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-white/50">Play a few tracks and your top artists appear here.</p>
          )}
        </section>

        <section className="glass p-5">
          <h2 className="font-display text-lg font-bold text-white">Top 5 songs</h2>
          {stats?.topSongs.length ? (
            <ol className="mt-3 space-y-2">
              {stats.topSongs.map((s, i) => (
                <li key={s.id} className="glass-soft flex items-center gap-3 p-2">
                  <span className="w-4 text-center text-[11px] font-bold text-white/40">{i + 1}</span>
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10">{s.thumbnail && <img src={s.thumbnail} alt="" className="h-full w-full object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-white">{s.title}</span>
                    <span className="block truncate text-[10.5px] text-white/45">{s.artist}</span>
                  </span>
                  <span className="text-[11px] text-white/40">{s.plays}×</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-white/50">No plays recorded yet.</p>
          )}
        </section>
      </div>

      <section className="glass p-5">
        <h2 className="font-display text-lg font-bold text-white">Genre fingerprint</h2>
        {stats?.genres.length ? (
          <div className="mt-4 space-y-2.5">
            {stats.genres.map((g) => (
              <div key={g.name}>
                <div className="mb-1 flex justify-between text-[11.5px] text-white/60">
                  <span>{g.name}</span>
                  <span>{Math.round((g.plays / genreTotal) * 100)}%</span>
                </div>
                <div className="progress-track h-2">
                  <div className="progress-fill" style={{ width: `${(g.plays / genreTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/50">Your genre pie chart fills in as you listen.</p>
        )}
      </section>

      <section className="glass-strong space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-white">Edit profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" maxLength={40} />
          <GlassInput value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" maxLength={280} />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">Avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatarSeed(a)} className={cn("glass-btn flex h-11 w-11 items-center justify-center rounded-xl !px-0 text-lg", avatarSeed === a && "border-cyan-300/70 shadow-[0_0_18px_-4px_rgba(0,212,255,0.9)]")}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-violet-200/80">Favorite genres (up to 8)</p>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {GENRES.slice(0, 28).map((g) => {
              const active = favoriteGenres.includes(g.name);
              return (
                <button
                  key={g.slug}
                  onClick={() => setFavoriteGenres((p) => (active ? p.filter((x) => x !== g.name) : p.length >= 8 ? p : [...p, g.name]))}
                  className={cn("glass-badge shrink-0 px-3 py-1.5", active ? "border-violet-300/70 bg-violet-400/20 text-violet-100" : "text-white/60")}
                >
                  {g.icon} {g.name}
                </button>
              );
            })}
          </div>
        </div>
        <label className="glass-soft flex items-center justify-between px-3 py-2.5">
          <span className="text-[13px] text-white/75">Public profile (others can see your activity)</span>
          <GlassToggle checked={isPublic} onChange={setIsPublic} label="Public profile" />
        </label>
        <div className="flex items-center gap-2">
          <GlassButton variant="primary" onClick={save} disabled={saving} icon={<Save className="h-4 w-4" />}>{saving ? "Saving…" : "Save profile"}</GlassButton>
          <span className="text-[11.5px] text-white/40">{settings ? `Audio quality: ${settings.audioQuality}` : ""}</span>
        </div>
      </section>
    </div>
  );
}
