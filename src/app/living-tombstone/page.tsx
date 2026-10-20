import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "The Living Tombstone",
  description:
    "The Living Tombstone collection: Five Nights at Freddy's songs, It's Been So Long, My Ordinary Life, Discord, I Can't Fix You, collabs with CG5 and remixes — full-length streams.",
};

const SIBLINGS = [
  { href: "/undertale", label: "❤️ Undertale OST" },
  { href: "/geometry-dash", label: "🟦 Geometry Dash OST" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/nasheed", label: "🎤 أناشيد و أشعار" },
];

export default function LivingTombstonePage() {
  return (
    <CatalogHub
      sectionId="living-tombstone"
      eyebrow="Artist collection"
      description="The Living Tombstone, in three shelves: 🎮 FNAF & Gaming (the Five Nights at Freddy's songs, Secret of the Mimic, Baldi's Basics, I Wanna Be A Machine), 🎤 Originals (My Ordinary Life, Discord, I Can't Fix You, Drunk, Be Alone) and 🤝 Collabs & Remixes (4GET with CG5, Fight Til' I'm Good Enough for Murder Drones, Savlonic's Epoch, Die in a Fire)."
      siblings={SIBLINGS}
    />
  );
}
