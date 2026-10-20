import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Skillet",
  description:
    "Skillet — Comatose, Awake, Rise, Unleashed and Dominion: Monster, Hero, Awake and Alive, Whispers in the Dark, Feel Invincible, Legends and more. Full-length streams.",
};

const SIBLINGS = [
  { href: "/fall-out-boy", label: "🖤 Fall Out Boy" },
  { href: "/imagine-dragons", label: "🐉 Imagine Dragons" },
  { href: "/geometry-dash", label: "🟦 Geometry Dash OST" },
  { href: "/ncs", label: "🎵 NCS library" },
];

export default function SkilletPage() {
  return (
    <CatalogHub
      sectionId="skillet"
      eyebrow="Artist collection"
      description="Skillet's hard-rock catalogue by era: Comatose (Rebirthing, Whispers in the Dark, The Last Night), Awake (Monster, Hero, Awake and Alive, Forsaken), Rise (Sick of It, American Noise, Not Gonna Die, Stars), Unleashed (Feel Invincible, Legends, Save Me, Trading Places) and Dominion (Psycho in My Head, Dominion)."
      siblings={SIBLINGS}
    />
  );
}
