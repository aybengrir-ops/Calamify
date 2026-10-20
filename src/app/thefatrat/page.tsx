import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "TheFatRat — Full Collection",
  description: "All 36 TheFatRat tracks — Unity, Monody, Windfall, Xenogenesis, Time Lapse and more. Copyright-free, streaming full-length.",
};

const SIBLINGS = [
  { href: "/alan-walker", label: "🎧 Alan Walker & Marshmello" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/geometry-dash", label: "🟦 Geometry Dash OST" },
  { href: "/nasheed", label: "🎤 أناشيد و أشعار" },
];

export default function TheFatRatPage() {
  return (
    <CatalogHub
      sectionId="thefatrat"
      eyebrow="Chart Your Course 🚀"
      description="The complete TheFatRat collection — glitch hop, electro house, melodic bass and the vocal anthems with Laura Brehm, Anjulie, Lola Blanc, AleXa, Cecilia Gault and Maisy Kay. Copyright-free for creators, full-length for you."
      siblings={SIBLINGS}
    />
  );
}
