import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Geometry Dash OST — Main Levels, Meltdown & Demon List",
  description: "The complete Geometry Dash soundtrack: 22 main levels, Meltdown & Subzero, classic demons and the integrated demon list — Creative Commons, full-length streams.",
};

const SIBLINGS = [
  { href: "/thefatrat", label: "🎮 TheFatRat" },
  { href: "/alan-walker", label: "🎧 Alan Walker & Marshmello" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/nasheed", label: "🎤 أناشيد و أشعار" },
];

export default function GeometryDashPage() {
  return (
    <CatalogHub
      sectionId="geometry-dash"
      eyebrow="Creative Commons OST"
      description="Every Geometry Dash theme in one place: the 22 main levels (Stereo Madness → Fingerdash), Meltdown & Subzero, the classic demons (Bloodbath, Cataclysm, Yatagarasu, Acu, Sakupen Circles…) and the integrated demon list (Sonic Wave, Tartarus, Acheron, Slaughterhouse, The Golden, KOCMOC, Tidal Wave, Kenos, White Space, Menace, Freedom…). Filter by sub-group, search by level, and stream each one full-length."
      siblings={SIBLINGS}
    />
  );
}
