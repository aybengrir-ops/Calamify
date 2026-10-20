"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { SongList } from "@/components/SongList";
import { GlassBadge, SectionTitle, SongRowSkeleton } from "@/components/ui/Glass";
import { usePlayer } from "@/store/player";
import { warmList } from "@/lib/preloader";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CollectionMeta {
  key: string;
  name: string;
  nameEn?: string;
  description: string;
  icon: string;
  from: string;
  to: string;
  copyright: string;
}
interface CollectionGroup {
  key: string;
  name: string;
  icon: string;
  collections: CollectionMeta[];
}

/**
 * Phonk / Phunk / Hardcore / Dreamcore, Anime (OP·ED·OST·Lofi·Remixes) and
 * أناشيد + أشعار — one hub, three groups, every row playable full-length.
 */
export function CollectionsHub({
  group,
  title,
  eyebrow,
  subtitle,
  variant = "section",
}: {
  group?: "phonk" | "anime" | "nasheed";
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  variant?: "section" | "page";
}) {
  const [groups, setGroups] = useState<CollectionGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>(group || "phonk");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [meta, setMeta] = useState<CollectionMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const playContext = usePlayer((s) => s.playContext);
  const setShuffle = usePlayer((s) => s.setShuffle);

  useEffect(() => {
    let alive = true;
    api<{ groups: CollectionGroup[] }>("/api/collections")
      .then((d) => {
        if (!alive) return;
        const list = (d.groups || []).filter((g) => !group || g.key === group);
        setGroups(list);
        if (list[0] && !activeKey) setActiveKey(list[0].collections[0]?.key || null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeKey) return;
    let alive = true;
    setLoading(true);
    api<{ collection: CollectionMeta; tracks: Song[] }>(`/api/collection/${encodeURIComponent(activeKey)}?limit=30`)
      .then((d) => {
        if (!alive) return;
        setTracks(d.tracks || []);
        setMeta(d.collection);
        warmList(d.tracks || [], 3);
      })
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [activeKey]);

  const visibleGroups = group ? groups.filter((g) => g.key === group) : groups.filter((g) => g.key === activeGroup);
  const collections = visibleGroups[0]?.collections || [];
  const total = tracks.reduce((a, b) => a + (b.duration || 0), 0);

  return (
    <section className={cn("mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6", variant === "page" && "pt-8")}>
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-strong relative overflow-hidden p-6 sm:p-9">
        <span className="absolute inset-0 opacity-40" style={{ background: meta ? `linear-gradient(135deg, ${meta.from}, ${meta.to})` : "linear-gradient(135deg,#7f1d1d,#7b2ff7,#00d4ff)" }} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/60 to-transparent" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GlassBadge tone="gold">
              <ShieldCheck className="h-3 w-3" /> Copyright free
            </GlassBadge>
            <GlassBadge tone="cyan">Full-length streams</GlassBadge>
            <GlassBadge tone="purple">Innertube + Audius + Newgrounds</GlassBadge>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold text-white drop-shadow sm:text-5xl">
            {title || (meta ? `${meta.icon} ${meta.name}` : "🏎️ Phonk · 🎌 Anime · 🕌 Nasheed")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            {subtitle || meta?.description || "Aggressive drift phonk, anime openings and nasheeds — all copyright-free, all streaming end to end."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => tracks.length && playContext(tracks, 0)} disabled={!tracks.length} className="glass-btn glass-btn-primary flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
              <Play className="h-4 w-4 fill-white" /> Play all
            </button>
            <button
              onClick={() => {
                if (!tracks.length) return;
                setShuffle(true);
                playContext([...tracks].sort(() => Math.random() - 0.5), 0);
              }}
              disabled={!tracks.length}
              className="glass-btn flex items-center gap-2 !rounded-full px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            {variant === "section" && (
              <Link href={`/${group || activeGroup}`} className="glass-btn flex items-center gap-1.5 !rounded-full px-5 py-2.5 text-sm">
                Open the hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {!group && (
              <div className="ml-auto flex gap-1.5">
                {groups.map((g) => (
                  <button key={g.key} onClick={() => setActiveGroup(g.key)} className={cn("glass-btn !rounded-full px-3.5 py-1.5 text-[11px]", activeGroup === g.key && "glass-btn-primary font-semibold")}>
                    {g.icon} {g.key}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {!group && groups.length > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {groups.map((g) => (
            <button
              key={g.key}
              onClick={() => {
                setActiveGroup(g.key);
                setActiveKey(g.collections[0]?.key || null);
              }}
              className={cn("glass glass-card p-4 text-left", activeGroup === g.key && "border-cyan-300/60 shadow-[0_0_26px_-10px_rgba(0,212,255,0.9)]")}
            >
              <span className="text-2xl">{g.icon}</span>
              <p className="mt-2 font-display text-sm font-bold text-white">{g.name}</p>
              <p className="mt-1 text-[11px] text-white/50">{g.collections.length} collections</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <SectionTitle eyebrow={eyebrow || "Collections"} title="Pick a frequency" subtitle={`${collections.length} curated sets · tap to load the full tracklist`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {collections.map((c, i) => (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 10) * 0.03 }}
              onClick={() => setActiveKey(c.key)}
              className={cn("glass glass-card group relative overflow-hidden p-4 text-left", activeKey === c.key && "border-cyan-300/60 shadow-[0_0_26px_-10px_rgba(0,212,255,0.9)]")}
            >
              <span className="absolute inset-0 opacity-40 transition group-hover:opacity-65" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
              <span className="relative block text-2xl">{c.icon}</span>
              <p className="relative mt-2 truncate font-display text-[13px] font-bold text-white" dir="auto">{c.name}</p>
              {c.nameEn && <p className="relative truncate text-[10.5px] text-white/60">{c.nameEn}</p>}
              <p className="relative mt-1 line-clamp-2 text-[10.5px] leading-snug text-white/55">{c.description}</p>
              <span className="glass-badge relative mt-2 inline-block px-2 py-0.5 text-[9px] text-emerald-200">✓ {c.copyright}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <SectionTitle
          eyebrow={meta?.name}
          title={meta ? `${meta.icon} ${meta.name}` : "Tracks"}
          subtitle={tracks.length ? `${tracks.length} tracks · ${Math.round(total / 60)} min · ${meta?.copyright}` : undefined}
        />
        {loading ? <SongRowSkeleton rows={6} /> : tracks.length ? <SongList songs={tracks} showAlbum={false} /> : <p className="glass-soft p-8 text-center text-sm text-white/50">Select a collection above.</p>}
      </div>
    </section>
  );
}
