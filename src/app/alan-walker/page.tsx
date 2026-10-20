import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Alan Walker & Marshmello",
  description: "45 tracks from Alan Walker and Marshmello — Faded, Alone, The Spectre, Darkside, Happier, Silence, Friends, Wolves and more, streaming full-length.",
};

const SIBLINGS = [
  { href: "/thefatrat", label: "🎮 TheFatRat" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/geometry-dash", label: "🟦 Geometry Dash OST" },
  { href: "/nasheed", label: "🎤 أناشيد و أشعار" },
];

export default function AlanWalkerMarshmelloPage() {
  return (
    <CatalogHub
      sectionId="aw-mm"
      eyebrow="Chart Your Course 🚀"
      description="Two of the biggest names in mainstage electronic, side by side: Alan Walker (Faded, Alone, The Spectre, Darkside, All Falls Down, On My Way, Lily, Diamond Heart, Ignite, Hero, Fire!) and Marshmello (Alone, Happier, Silence, Friends, Wolves, Ritual, Here with Me, One Thing Right, El Merengue, Tempo). Filter by artist, genre or vocal collab — every track streams full-length."
      siblings={SIBLINGS}
    />
  );
}
