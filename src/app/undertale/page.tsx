import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Undertale OST — Toby Fox",
  description:
    "The complete Undertale soundtrack by Toby Fox: MEGALOVANIA, Bonetrousle, Heartache, Death by Glamour, Hopes and Dreams, Gaster's Theme and more — organised by area, streaming full-length.",
};

const SIBLINGS = [
  { href: "/living-tombstone", label: "🪦 The Living Tombstone" },
  { href: "/geometry-dash", label: "🟦 Geometry Dash OST" },
  { href: "/thefatrat", label: "🎮 TheFatRat" },
  { href: "/ncs", label: "🎵 NCS library" },
];

export default function UndertalePage() {
  return (
    <CatalogHub
      sectionId="undertale"
      eyebrow="Official OST · Toby Fox"
      description="Every Undertale theme, organised the way you play it: 🌱 Start & Ruins, ❄️ Snowdin, 💧 Waterfall, 🔥 Hotland & CORE, ⚔️ Boss Battles and 🎭 Endings & Secrets — from Once Upon a Time to MEGALOVANIA, ASGORE, Hopes and Dreams and Gaster's Theme."
      siblings={SIBLINGS}
    />
  );
}
