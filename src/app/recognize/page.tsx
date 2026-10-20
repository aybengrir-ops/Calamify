import type { Metadata } from "next";
import { Recognizer } from "@/components/Recognizer";

export const metadata: Metadata = {
  title: "Recognize a Song",
  description:
    "Record a short clip or drop an audio file — Calamify fingerprints it in your browser (spectral envelope, centroid, flux, BPM) and ranks matching tracks, all streamed through our own proxy.",
};

export default function RecognizePage() {
  return <Recognizer />;
}
