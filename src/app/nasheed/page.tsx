import type { Metadata } from "next";
import Link from "next/link";
import { CollectionsHub } from "@/components/CollectionsSection";
import { CatalogShelf } from "@/components/CatalogShelf";

export const metadata: Metadata = {
  title: "أناشيد إسلامية و أشعار — Nasheeds & Poetry",
  description: "Islamic nasheeds, madih nabawi, duas and adhkar, Arabic, Nabati and classical poetry, sung qasidas and Sufi chants.",
};

export default function NasheedPage() {
  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 pt-8 sm:px-6">
        <span className="glass-badge px-3 py-1.5 text-white/60">More copyright-free hubs:</span>
        <Link href="/thefatrat" className="glass-btn glass-btn-primary !rounded-full px-4 py-2 text-xs">🎮 TheFatRat — 36 tracks</Link>
        <Link href="/alan-walker" className="glass-btn glass-btn-primary !rounded-full px-4 py-2 text-xs">🎧 Alan Walker &amp; Marshmello — 45 tracks</Link>
        <Link href="/ncs" className="glass-btn !rounded-full px-4 py-2 text-xs">🎵 NCS</Link>
        <Link href="/geometry-dash" className="glass-btn !rounded-full px-4 py-2 text-xs">🎮 Geometry Dash</Link>
        <Link href="/newgrounds" className="glass-btn !rounded-full px-4 py-2 text-xs">🎼 Newgrounds</Link>
      </div>
      <CollectionsHub
      group="nasheed"
      title="🕌 أناشيد إسلامية و أشعار"
      eyebrow="Nasheeds & Arabic poetry"
      subtitle="أناشيد بدون حقوق، مديح نبوي، أدعية و أذكار، شعر عربي و نبطي و فصحى، قصائد مغناة و إنشاد صوفي — ga3 kaytsm3o kamlin."
      variant="page"
    />
      <CatalogShelf sectionId="thefatrat" hubHref="/thefatrat" />
      <CatalogShelf sectionId="aw-mm" hubHref="/alan-walker" note="Alan Walker & Marshmello side by side — the two biggest mainstage names, full-length" />
    </div>
  );
}
