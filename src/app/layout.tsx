import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { Starfield } from "@/components/Starfield";
import { SmoothScroll } from "@/components/SmoothScroll";
import { AppShell } from "@/components/AppShell";
import { SoundEffectsProvider } from "@/components/SoundEffectsProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Splash } from "@/components/Splash";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerBar } from "@/components/PlayerBar";
import { MobileTabs } from "@/components/MobileTabs";
import { AudioEngine } from "@/components/AudioEngine";
import { ContextMenu } from "@/components/ContextMenu";
import { Toasts } from "@/components/Toasts";
import { AuthModal, AddToPlaylistDialog, CreatePlaylistDialog } from "@/components/Dialogs";

export const metadata: Metadata = {
  metadataBase: new URL("https://calamifyy.vercel.app"),
  title: {
    default: "Calamify - Your Universe of Music",
    template: "%s · Calamify",
  },
  description:
    "Calamify - Kol l-Musica dyal l-Kawn. Bla 7doud. A real streaming platform: YouTube, Newgrounds, NCS, Geometry Dash, Quran, Anime, Phonk and Nasheeds - search any song, press play, hear it full-length. Glassmorphism space UI, playlists, synced",
  applicationName: "Calamify",
  manifest: "/manifest.webmanifest",
  keywords: [
    "music streaming",
    "space theme",
    "glassmorphism",
    "PWA",
    "playlists",
    "full length songs",
    "Innertube",
    "youtubei.js",
    "music player",
    "audio player",
    "Calamify",
    "music app",
    "music platform",
    "music streaming app",
    "music streaming",
  ],
  authors: [{ name: "Ayaman The Great Publisher" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Calamify",
    startupImage: [{ url: "/icon.png" }],
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512" }],
  },
  openGraph: {
    type: "website",
    siteName: "Calamify",
    title: "Calamify - Your Universe of Music",
    description:
      "Every genre. Every mood. One destination. Full-length streaming wrapped in cosmic glass.",
    url: "/",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Calamify planet logo" }],
  },
  twitter: {
    card: "summary",
    title: "Calamify - Your Universe of Music",
    description:
      "Search any song, play it full-length. Space-themed glassmorphism music streaming PWA.",
    images: ["/icon.png"],
  },
  robots: { index: true, follow: true },

  // ✅ Google Site Verification
  verification: {
    google: "Wzp2jsoRf8l4gT4jt8EIym_vywB2AdaFo9cnNeaWbgw",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05060f" },
    { media: "(prefers-color-scheme: light)", color: "#cef2ff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // ✅ JSON-LD باش Google يثبّت اسم Calamify و اللوكو
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Calamify",
    alternateName: ["Calamify Music", "Calamify App"],
    url: "https://calamifyy.vercel.app",
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-transparent text-white antialiased">
        <Starfield />
        <SmoothScroll />
        <AppShell />
        <SoundEffectsProvider />
        <OfflineBanner />
        <Splash />
        <Navbar />
        <main className="relative z-10 pt-20 sm:pt-24">{children}</main>
        <Footer />
        <PlayerBar />
        <MobileTabs />
        <AudioEngine />
        <ContextMenu />
        <AuthModal />
        <AddToPlaylistDialog />
        <CreatePlaylistDialog />
        <Toasts />
      </body>
    </html>
  );
}