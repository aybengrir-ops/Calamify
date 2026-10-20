import type { Metadata } from "next";
import { CollectionsHub } from "@/components/CollectionsSection";

export const metadata: Metadata = {
  title: "Phonk · Phunk · Hardcore · Dreamcore",
  description: "Copyright-free phonk drift, phunk groove, hardcore techno and dreamcore ambient — full-length streams.",
};

export default function PhonkPage() {
  return (
    <CollectionsHub
      group="phonk"
      title="🏎️ Phonk · Phunk · Hardcore · Dreamcore"
      eyebrow="Copyright free"
      subtitle="Drift phonk, cowbell madness, gabber, frenchcore and liminal-space dreamcore — every track free to use and streamed in full."
      variant="page"
    />
  );
}
