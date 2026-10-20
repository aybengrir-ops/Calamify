"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, GripVertical, Heart, Lock, Globe2, MoreHorizontal, Music2, Pencil, Play, Plus, Share2, Shuffle, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { SongRow } from "@/components/SongList";
import { GlassBadge, GlassButton, GlassInput, GlassToggle, SongRowSkeleton } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { formatTotalDuration, type Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface PlaylistData {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  canEdit: boolean;
  createdAt: string;
  tracks: Song[];
  totalDuration: number;
}

export default function PlaylistPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");
  const router = useRouter();
  const [data, setData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const { user, updatePlaylist, deletePlaylist, removeSongFromPlaylist, reorderPlaylist, createPlaylist, addSongsToPlaylist, isLiked, toggleLike } = useSession();
  const { playContext, setShuffle } = usePlayer();
  const { toast, setAuthOpen } = useUi();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ playlist: PlaylistData }>(`/api/playlists/${id}`);
      setData(res.playlist);
      setName(res.playlist.name);
      setDescription(res.playlist.description || "");
      setIsPublic(res.playlist.isPublic);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1300px] space-y-6 px-4 pb-16 pt-8 sm:px-6">
        <div className="skeleton h-56 w-full" />
        <SongRowSkeleton rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🌑</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">This playlist drifted out of range</h1>
        <p className="mt-2 text-sm text-white/55">It may be private, deleted, or belong to another explorer.</p>
        <Link href="/playlists" className="glass-btn glass-btn-primary mt-6 inline-flex !rounded-full px-5 py-2.5 text-sm">Browse playlists</Link>
      </div>
    );
  }

  const tracks = data.tracks;
  const reorder = async (from: number, to: number) => {
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setData({ ...data, tracks: next });
    await reorderPlaylist(data.id, next.map((t) => t.id));
    toast("Playlist reordered", "success");
  };

  const duplicate = async () => {
    if (!user) {
      setAuthOpen(true, "signup");
      return;
    }
    const newId = await createPlaylist(`${data.name} (copy)`, data.description || "", data.isPublic);
    if (newId && tracks.length) {
      await addSongsToPlaylist(newId, tracks);
      router.push(`/playlist/${newId}`);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/playlist/${data.id}`;
    try {
      if (navigator.share) await navigator.share({ title: data.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Playlist link copied", "success");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-10">
        <span className="absolute inset-0 opacity-50" style={{ background: "linear-gradient(135deg,#7b2ff7,#00d4ff)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/60 to-transparent" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">
          <span className="glass-strong flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-1.5 sm:h-48 sm:w-48">
            {data.coverUrl ? <img src={data.coverUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : <Music2 className="h-16 w-16 text-white/70" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="cyan">Playlist</GlassBadge>
              <GlassBadge>{data.isPublic ? <><Globe2 className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}</GlassBadge>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">{data.name}</h1>
            {data.description && <p className="mt-2 max-w-2xl text-sm text-white/70">{data.description}</p>}
            <p className="mt-1 text-[11.5px] text-white/55">
              {tracks.length} tracks · {formatTotalDuration(data.totalDuration)} · created {new Date(data.createdAt).toLocaleDateString()}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => playContext(tracks, 0)} disabled={!tracks.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
                <Play className="h-4 w-4 fill-white" /> Play all
              </button>
              <button
                onClick={() => {
                  setShuffle(true);
                  playContext([...tracks].sort(() => Math.random() - 0.5), 0);
                }}
                disabled={!tracks.length}
                className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm disabled:opacity-40"
              >
                <Shuffle className="h-4 w-4" /> Shuffle
              </button>
              <button onClick={share} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Share2 className="h-4 w-4" /> Share</button>
              {data.canEdit && (
                <>
                  <button onClick={() => setEditing((v) => !v)} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Pencil className="h-4 w-4" /> {editing ? "Close editor" : "Edit"}</button>
                  <button onClick={duplicate} className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm"><Copy className="h-4 w-4" /> Duplicate</button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete "${data.name}"? This cannot be undone.`)) return;
                      await deletePlaylist(data.id);
                      router.push("/playlists");
                    }}
                    className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm text-pink-200"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {editing && data.canEdit && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong space-y-3 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200/80">Edit playlist</p>
          <GlassInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" maxLength={60} />
          <GlassInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" maxLength={160} />
          <label className="glass-soft flex items-center justify-between px-3 py-2.5">
            <span className="text-[13px] text-white/75">Public playlist</span>
            <GlassToggle checked={isPublic} onChange={setIsPublic} label="Public playlist" />
          </label>
          <div className="flex gap-2">
            <GlassButton variant="primary" onClick={async () => { await updatePlaylist(data.id, { name, description, isPublic }); setData({ ...data, name, description, isPublic }); setEditing(false); toast("Playlist updated", "success"); }}>
              Save changes
            </GlassButton>
            <GlassButton onClick={() => setEditing(false)}>Cancel</GlassButton>
          </div>
        </motion.div>
      )}

      {tracks.length === 0 ? (
        <div className="glass-soft flex flex-col items-center gap-3 p-12 text-center">
          <Plus className="h-8 w-8 text-white/40" />
          <p className="max-w-md text-sm text-white/60">Empty playlist. Add tracks from any song&apos;s “…” menu → “Add to playlist”.</p>
          <Link href="/search" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Search the universe</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((song, i) => (
            <div
              key={`${song.id}-${i}`}
              draggable={data.canEdit}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) void reorder(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn("group relative", overIndex === i && dragIndex !== null && "rounded-2xl ring-2 ring-cyan-300/60", dragIndex === i && "opacity-50")}
            >
              {data.canEdit && <GripVertical className="absolute -left-1 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 cursor-grab text-white/25 group-hover:text-white/60 lg:block" />}
              <SongRow song={song} context={tracks} position={i} />
              <div className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1 group-hover:flex">
                <button onClick={() => void toggleLike(song)} aria-label="Like" className={cn("glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0", isLiked(song.id) && "border-pink-300/60 text-pink-200")}>
                  <Heart className={cn("h-3.5 w-3.5", isLiked(song.id) && "fill-pink-400")} />
                </button>
                {data.canEdit && (
                  <button
                    onClick={async () => {
                      await removeSongFromPlaylist(data.id, song.id);
                      setData({ ...data, tracks: tracks.filter((t, idx) => idx !== i) });
                      toast("Removed from playlist", "info");
                    }}
                    aria-label="Remove from playlist"
                    className="glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0 text-pink-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => useUi.getState().openContextMenu(song, window.innerWidth / 2, window.innerHeight / 2, tracks)} aria-label="More" className="glass-btn flex h-8 w-8 items-center justify-center rounded-full !px-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
