import type { Metadata } from "next";
import { QuranSection } from "@/components/QuranSection";

export const metadata: Metadata = {
  title: "القرآن الكريم — Quran",
  description: "All 114 surahs with 176 reciters. Full-surah seekable audio and Arabic text, free and legal via alquran.cloud.",
};

export default function QuranPage() {
  return <QuranSection variant="page" />;
}
