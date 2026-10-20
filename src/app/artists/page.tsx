"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, UserPlus, UserCheck } from "lucide-react";
import { SectionTitle, GlassBadge } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { GENRES } from "@/lib/catalog";

const SPOTLIGHT = [
  "Queen", "The Weeknd", "Daft Punk", "Billie Eilish", "Coldplay", "Kendrick Lamar", "Tame Impala", "Dua Lipa",
  "Hans Zimmer", "Tyler, The Creator", "Sade", "ODESZA", "Frank Ocean", "Radiohead", "Arijit Singh", "Bad Bunny",
  "BTS", "Taylor Swift", "Drake", "SZA", "Flume", "Nipsey Hussle", "Lana Del Rey", "Bonobo",
];

export default function ArtistsPage() {
  const { artists, isFollowing, followArtist, unfollowArtist } = useSession();

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-12 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="animate-float absolute -right-10 -top-10 h-52 w-52 rounded-full bg-gradient-to-br from-pink-500/30 to-violet-500/25 blur-3xl" />
        <GlassBadge tone="pink">Artists</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-5xl">
          <Users className="h-8 w-8 text-pink-200" /> Stellar Artists
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
          Follow the artists you love, open their pages for top tracks and discography, and spin up an endless radio from any of their songs.
        </p>
      </motion.header>

      {artists.length > 0 && (
        <section>
          <SectionTitle eyebrow="Following" title="Your followed artists" subtitle={`${artists.length} artists · you get notified on new releases`} />
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
            {artists.map((a) => (
              <div key={a.artistName} className="w-36 shrink-0 text-center">
                <Link href={`/artist/${encodeURIComponent(a.artistName)}`} className="group flex flex-col items-center gap-2">
                  <span className="glass-strong relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full p-1">
                    {a.thumbnail ? <img src={a.thumbnail} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="text-2xl">🎤</span>}
                  </span>
                  <span className="truncate text-[12.5px] font-semibold text-white group-hover:text-cyan-200">{a.artistName}</span>
                </Link>
                <button onClick={() => void unfollowArtist(a.artistName)} className="glass-btn mt-1 flex w-full items-center justify-center gap-1 !rounded-full px-2 py-1 text-[10px]">
                  <UserCheck className="h-3 w-3" /> Following
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="Spotlight" title="Artists across the galaxy" subtitle="Tap to open an artist page with top songs, releases and radio" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SPOTLIGHT.map((name, i) => {
            const g = GENRES[i % GENRES.length];
            const following = isFollowing(name);
            return (
              <motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 12) * 0.03 }} className="glass glass-card group p-4 text-center">
                <Link href={`/artist/${encodeURIComponent(name)}`} className="block">
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 text-2xl" style={{ background: `linear-gradient(135deg, ${g.from}66, ${g.to}66)` }}>
                    {g.icon}
                  </span>
                  <p className="mt-3 truncate text-[13px] font-semibold text-white group-hover:text-cyan-200">{name}</p>
                  <p className="truncate text-[10.5px] text-white/45">{g.name}</p>
                </Link>
                <button
                  onClick={() => (following ? void unfollowArtist(name) : void followArtist(name, "", ""))}
                  className={`glass-btn mt-3 flex w-full items-center justify-center gap-1.5 !rounded-full px-3 py-1.5 text-[11px] ${following ? "border-cyan-300/60 text-cyan-200" : ""}`}
                >
                  {following ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                  {following ? "Following" : "Follow"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
