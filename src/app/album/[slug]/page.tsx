"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Disc3, Play, Share2, Shuffle } from "lucide-react";
import { trendingApi } from "@/lib/api";
import { SongList, QuickPlayButton, ShuffleButton } from "@/components/SongList";
import { GlassBadge, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { formatTotalDuration, type Song } from "@/lib/types";

export default function AlbumPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(String(params.slug || ""));
  const [tracks, setTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { saveAlbum, unsaveAlbum, isAlbumSaved } = useSession();
  const { toast } = useUi();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    trendingApi({ query: slug.replace(/ — /g, " "), limit: 18 })
      .then((d) => alive && setTracks(d.results || []))
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const [artistName, albumName] = slug.includes(" — ") ? slug.split(" — ") : ["Various Artists", slug];
  const saved = isAlbumSaved(slug);
  const cover = tracks[0]?.thumbnail || "";
  const totalDuration = tracks.reduce((a, b) => a + (b.duration || 0), 0);

  const share = async () => {
    const url = `${window.location.origin}/album/${encodeURIComponent(slug)}`;
    try {
      if (navigator.share) await navigator.share({ title: albumName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Album link copied", "success");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-lg" />}
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/70 to-transparent" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">
          <span className="glass-strong flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-1.5 sm:h-52 sm:w-52">
            {cover ? <img src={cover} alt={albumName} className="h-full w-full rounded-xl object-cover" /> : <Disc3 className="h-16 w-16 text-white/40" />}
          </span>
          <div className="min-w-0 flex-1">
            <GlassBadge tone="purple">Album</GlassBadge>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white sm:text-5xl">{albumName}</h1>
            <p className="mt-2 text-sm text-white/65">
              <Link href={`/artist/${encodeURIComponent(artistName)}`} className="font-semibold text-white/85 hover:text-cyan-200">{artistName}</Link>
              {" · "}{new Date().getFullYear()} · {tracks.length} tracks · {formatTotalDuration(totalDuration)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tracks.length > 0 && <QuickPlayButton songs={tracks} />}
              {tracks.length > 0 && <ShuffleButton songs={tracks} />}
              <button
                onClick={() => (saved ? void unsaveAlbum(slug) : void saveAlbum({ albumKey: slug, name: albumName, artist: artistName, coverUrl: cover, query: slug }))}
                className={`glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm ${saved ? "border-cyan-300/60 text-cyan-200" : ""}`}
              >
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? "Saved to library" : "Save album"}
              </button>
              <button onClick={share} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Share2 className="h-4 w-4" /> Share</button>
            </div>
          </div>
        </div>
      </motion.header>

      {loading ? (
        <SongRowSkeleton rows={8} />
      ) : tracks.length === 0 ? (
        <div className="glass-soft p-10 text-center">
          <p className="text-3xl">💿</p>
          <p className="mt-3 text-sm text-white/55">No tracks resolved for this album. Try searching the artist instead.</p>
          <Link href={`/artist/${encodeURIComponent(artistName)}`} className="glass-btn glass-btn-primary mt-5 inline-flex !rounded-full px-5 py-2.5 text-sm">Open artist page</Link>
        </div>
      ) : (
        <section>
          <div className="mb-3 flex items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
            <span className="w-6 text-center">#</span>
            <span className="flex-1">Title</span>
            <span className="hidden w-24 sm:block">Plays</span>
            <span className="w-12 text-right">Time</span>
          </div>
          <SongList songs={tracks} numbered />
        </section>
      )}
    </div>
  );
}
