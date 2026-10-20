"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search, SlidersHorizontal } from "lucide-react";
import { usePlayer } from "@/store/player";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

/** Bottom tab bar for phones (Spotify-style), sits above the mini player. */
export function MobileTabs() {
  const pathname = usePathname();
  const current = usePlayer((s) => s.current);
  const setExpanded = usePlayer((s) => s.setExpanded);

  return (
    <nav className={cn("fixed inset-x-2 z-40 md:hidden", current ? "bottom-[92px]" : "bottom-2")}>
      <div className="glass-strong mx-auto flex w-full max-w-md items-stretch justify-between gap-1 p-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className={cn("flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition", active ? "bg-white/12 text-cyan-200 shadow-[0_0_18px_-8px_rgba(0,212,255,0.9)]" : "text-white/55")}>
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
        {current && (
          <button onClick={() => setExpanded(true)} className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium text-pink-200">
            <span className="flex h-4 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="eq-bar w-[2.5px] rounded-full bg-pink-300" style={{ height: 14, animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            Playing
          </button>
        )}
      </div>
    </nav>
  );
}
