"use client";

import Link from "next/link";
import { AtSign, Send, Rss, Globe2, Music2 } from "lucide-react";
import { useState } from "react";
import { GlassButton, GlassInput } from "@/components/ui/Glass";
import { PlanetMark } from "@/components/Navbar";
import { api } from "@/lib/api";
import { useUi } from "@/store/ui";
import { GENRES } from "@/lib/catalog";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "All genres", href: "/explore" },
      { label: "Trending now", href: "/trending" },
      { label: "Curated playlists", href: "/playlists" },
      { label: "Stellar artists", href: "/artists" },
      { label: "Moods & activities", href: "/explore#moods" },
      { label: "Newgrounds Universe", href: "/newgrounds" },
      { label: "NCS · copyright free", href: "/ncs" },
      { label: "Geometry Dash OST", href: "/geometry-dash" },
      { label: "القرآن الكريم", href: "/quran" },
      { label: "Phonk & Hardcore", href: "/phonk" },
      { label: "Anime OP · ED · OST", href: "/anime" },
      { label: "أناشيد و أشعار", href: "/nasheed" },
      { label: "TheFatRat collection", href: "/thefatrat" },
      { label: "Alan Walker & Marshmello", href: "/alan-walker" },
      { label: "Undertale OST", href: "/undertale" },
      { label: "The Living Tombstone", href: "/living-tombstone" },
      { label: "Fall Out Boy", href: "/fall-out-boy" },
      { label: "Imagine Dragons", href: "/imagine-dragons" },
      { label: "Skillet", href: "/skillet" },
      { label: "Recognize a song", href: "/recognize" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Calamify", href: "/about" },
      { label: "How audio works", href: "/about#engine" },
      { label: "Your library", href: "/library" },
      { label: "Settings", href: "/settings" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of orbit", href: "/about#terms" },
      { label: "Privacy", href: "/about#privacy" },
      { label: "Audio sources", href: "/about#sources" },
      { label: "Community", href: "/about#community" },
      { label: "Contact", href: "/about#contact" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api<{ message?: string }>("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      toast(data.message || "Subscribed — stay in orbit ✨", "success");
      setEmail("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not subscribe", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="relative z-10 mt-24 px-3 pb-32 sm:px-5 sm:pb-36">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        {/* newsletter */}
        <section className="glass-strong relative overflow-hidden p-6 sm:p-8">
          <span className="animate-float absolute -right-8 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-400/30 blur-2xl" />
          <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Stay in Orbit</h3>
              <p className="mt-1.5 max-w-md text-sm text-white/60">Weekly dispatches: new releases, cosmic playlists and charts from 195 countries. No spam — only stardust.</p>
            </div>
            <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <GlassInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@galaxy.com" className="flex-1" />
              <GlassButton type="submit" variant="primary" disabled={busy} className="shrink-0">
                {busy ? "Sending…" : "Subscribe"}
              </GlassButton>
            </form>
          </div>
        </section>

        {/* main footer */}
        <div className="glass relative overflow-hidden p-6 sm:p-8">
          <span className="shooting-star" style={{ animationDelay: "2s" }} />
          <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <PlanetMark size={28} />
                <span className="logo-glow text-gradient font-display text-xl font-bold">Calamify</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">Your universe of music. Every genre, every mood, every corner of the galaxy — full-length, instant, and wrapped in glass.</p>
              <div className="mt-4 flex gap-2">
                {[
                  { icon: <AtSign className="h-4 w-4" />, label: "Social" },
                  { icon: <Send className="h-4 w-4" />, label: "Telegram" },
                  { icon: <Rss className="h-4 w-4" />, label: "Feed" },
                  { icon: <Music2 className="h-4 w-4" />, label: "Music" },
                  { icon: <Globe2 className="h-4 w-4" />, label: "Web" },
                ].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} className="glass-btn flex h-9 w-9 items-center justify-center rounded-xl !px-0">
                    {s.icon}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {GENRES.slice(0, 6).map((g) => (
                  <Link key={g.slug} href={`/genre/${g.slug}`} className="glass-badge px-2.5 py-1 text-white/55 transition hover:text-white">
                    {g.icon} {g.name}
                  </Link>
                ))}
              </div>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-[13px] text-white/60 transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="divider-planet mt-8" />
          <p className="mt-5 text-center text-[12.5px] text-white/45">
            © {new Date().getFullYear()} Calamify. Made with <span className="text-pink-300">💜</span> in the cosmos.
          </p>
        </div>
      </div>
    </footer>
  );
}
