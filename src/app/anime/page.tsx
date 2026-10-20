import type { Metadata } from "next";
import { CollectionsHub } from "@/components/CollectionsSection";

export const metadata: Metadata = {
  title: "Anime OP · ED · OST · Lofi · Remixes",
  description: "Copyright-free anime openings, endings, soundtracks, lofi beats and EDM/phonk remixes — full-length streams.",
};

export default function AnimePage() {
  return (
    <CollectionsHub
      group="anime"
      title="🎌 Anime Openings · Endings · OST"
      eyebrow="Copyright free"
      subtitle="OPs, EDs, battle themes, piano OSTs, lofi anime beats and phonk/EDM remixes — all streaming full-length."
      variant="page"
    />
  );
}
