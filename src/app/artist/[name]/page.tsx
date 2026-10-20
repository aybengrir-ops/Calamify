"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Disc3, Play, Radio, Shuffle, UserCheck, UserPlus } from "lucide-react";
import { artistApi, trendingApi } from "@/lib/api";
import { SongList } from "@/components/SongList";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import type { Song } from "@/lib/types";

interface ArtistData {
  artist: { name: string; thumbnail: string; cover: string; listeners: string; followers: string; verified: boolean; bio: string; genre: string; handle: string };
  topSongs: Song[];
  releases: { key: string; name: string; artist: string; cover: string; year: string; query: string; tracks: number }[];
  similar: { name: string }[];
  audiusTracks: Song[];
}

export default function ArtistPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(String(params.name || ""));
  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFollowing, followArtist, unfollowArtist } = useSession();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    artistApi(name)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [name]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-16 pt-8 sm:px-6">
        <div className="skeleton h-64 w-full" />
        <SongRowSkeleton rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🌑</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">No signal for “{name}”</h1>
        <Link href="/artists" className="glass-btn glass-btn-primary mt-6 inline-flex !rounded-full px-5 py-2.5 text-sm">Browse artists</Link>
      </div>
    );
  }

  const artist = data.artist;
  const songs = data.topSongs.length ? data.topSongs : data.audiusTracks;
  const following = isFollowing(artist.name);

  const playAll = () => {
    if (songs.length) usePlayer.getState().playContext(songs, 0);
  };
  const shuffle = () => {
    if (!songs.length) return;
    usePlayer.getState().setShuffle(true);
    usePlayer.getState().playContext([...songs].sort(() => Math.random() - 0.5), 0);
  };
  const radio = async () => {
    try {
      toast(`Tuning ${artist.name} radio…`, "info");
      const d = await trendingApi({ query: `${artist.name} mix`, limit: 25 });
      if (d.results?.length) {
        usePlayer.getState().playContext([...(songs[0] ? [songs[0]] : []), ...d.results], 0);
        toast(`${artist.name} radio is live`, "success");
      }
    } catch {
      toast("Radio unavailable", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-10 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        {artist.cover && <img src={artist.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-md" />}
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/70 to-transparent" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end">
          <span className="glass-strong flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full p-1.5 sm:h-44 sm:w-44">
            {artist.thumbnail ? <img src={artist.thumbnail} alt={artist.name} className="h-full w-full rounded-full object-cover" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600/60 to-cyan-400/50 text-4xl">🎤</span>}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="cyan">Artist</GlassBadge>
              {artist.verified && <GlassBadge tone="gold"><BadgeCheck className="h-3 w-3" /> Verified</GlassBadge>}
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold text-white drop-shadow sm:text-6xl">{artist.name}</h1>
            <p className="mt-2 text-sm text-white/65">{artist.listeners} monthly listeners · {artist.followers} followers{artist.genre ? ` · ${artist.genre}` : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={playAll} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold"><Play className="h-4 w-4 fill-white" /> Play all</button>
              <button onClick={shuffle} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Shuffle className="h-4 w-4" /> Shuffle</button>
              <button onClick={radio} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Radio className="h-4 w-4" /> Radio</button>
              <button
                onClick={() => (following ? void unfollowArtist(artist.name) : void followArtist(artist.name, artist.thumbnail, artist.listeners))}
                className={`glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm ${following ? "border-cyan-300/60 text-cyan-200" : ""}`}
              >
                {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {following ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <section>
        <SectionTitle eyebrow="Popular" title="Top songs" subtitle={`${songs.length} tracks · press play for the full-length stream`} />
        <SongList songs={songs} />
      </section>

      {data.releases.length > 0 && (
        <section>
          <SectionTitle eyebrow="Discography" title="Albums & singles" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.releases.map((r, i) => (
              <motion.div key={r.key} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}>
                <Link href={`/album/${encodeURIComponent(`${r.artist} — ${r.name}`)}`} className="glass glass-card block overflow-hidden p-3">
                  <span className="block aspect-square overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-700/40 to-cyan-500/30">
                    {r.cover ? <img src={r.cover} alt={r.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-3xl"><Disc3 className="h-10 w-10 text-white/40" /></span>}
                  </span>
                  <p className="mt-2.5 truncate text-[13px] font-semibold text-white">{r.name}</p>
                  <p className="truncate text-[11px] text-white/50">{r.year} · {r.tracks} tracks</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {data.similar.length > 0 && (
        <section>
          <SectionTitle eyebrow="Fans also like" title="Similar artists" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {data.similar.map((s) => (
              <Link key={s.name} href={`/artist/${encodeURIComponent(s.name)}`} className="glass glass-btn flex w-40 shrink-0 items-center gap-2.5 !rounded-2xl p-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/60 to-cyan-400/50 text-sm">🎤</span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-white">{s.name}</span>
                  <span className="block text-[10.5px] text-white/45">Artist</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="About" title={`Who is ${artist.name}?`} />
        <div className="glass p-6">
          <p className="text-[13.5px] leading-relaxed text-white/70">{artist.bio}</p>
        </div>
      </section>
    </div>
  );
}
