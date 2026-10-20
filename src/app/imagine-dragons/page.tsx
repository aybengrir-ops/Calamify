import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Imagine Dragons",
  description:
    "Imagine Dragons — Night Visions through Mercury: Radioactive, Demons, It's Time, Believer, Thunder, Natural, Bad Liar, Enemy, Bones and more. Full-length streams.",
};

const SIBLINGS = [
  { href: "/fall-out-boy", label: "🖤 Fall Out Boy" },
  { href: "/skillet", label: "🔥 Skillet" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/undertale", label: "❤️ Undertale OST" },
];

export default function ImagineDragonsPage() {
  return (
    <CatalogHub
      sectionId="imagine-dragons"
      eyebrow="Artist collection"
      description="Imagine Dragons by era: Night Visions (It's Time, Radioactive, Demons, On Top of the World), Smoke + Mirrors (I Bet My Life, Shots, Warriors, Gold), Evolve (Believer, Thunder, Whatever It Takes, Walking the Wire), Origins (Natural, Bad Liar, Zero, Birds) and Mercury (Wrecked, Enemy, Bones, Sharks, Symphony, Take Me to the Beach)."
      siblings={SIBLINGS}
    />
  );
}
