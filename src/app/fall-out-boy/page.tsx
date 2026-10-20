import type { Metadata } from "next";
import { CatalogHub } from "@/components/CatalogHub";

export const metadata: Metadata = {
  title: "Fall Out Boy",
  description:
    "Fall Out Boy — from Take This to Your Grave and From Under the Cork Tree through Save Rock and Roll, American Beauty/American Psycho and So Much (For) Stardust. Full-length streams.",
};

const SIBLINGS = [
  { href: "/imagine-dragons", label: "🐉 Imagine Dragons" },
  { href: "/skillet", label: "🔥 Skillet" },
  { href: "/ncs", label: "🎵 NCS library" },
  { href: "/nasheed", label: "🎤 أناشيد و أشعار" },
];

export default function FallOutBoyPage() {
  return (
    <CatalogHub
      sectionId="fall-out-boy"
      eyebrow="Artist collection"
      description="The Fall Out Boy arc in one shelf: the Take This to Your Grave / Cork Tree pop-punk era (Grand Theft Autumn, Saturday, Sugar We're Goin Down, Dance Dance), the Arms Race & Folie years (Thnks fr th Mmrs, I Don't Care, America's Suitehearts), the stadium era (The Phoenix, Light Em Up, Centuries, Uma Thurman, Immortals) and the modern records (Love from the Other Side, Heartbreak Feels So Good, So Much (For) Stardust)."
      siblings={SIBLINGS}
    />
  );
}
