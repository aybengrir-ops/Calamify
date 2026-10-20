"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NewgroundsHub } from "@/components/NewgroundsHub";
import { GlassBadge } from "@/components/ui/Glass";

function HubClient() {
  const params = useSearchParams();
  const playlist = params.get("playlist") || undefined;
  return (
    <div className="space-y-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 pt-8 sm:px-6">
        <GlassBadge tone="gold">Audio Portal</GlassBadge>
        <Link href="/ncs" className="glass-btn !rounded-full px-4 py-2 text-xs">🎵 NCS library</Link>
        <Link href="/geometry-dash" className="glass-btn !rounded-full px-4 py-2 text-xs">🎮 Geometry Dash OST</Link>
        <Link href="/explore" className="glass-btn !rounded-full px-4 py-2 text-xs">All genres</Link>
      </div>
      <NewgroundsHub variant="page" initialPlaylist={playlist} />
    </div>
  );
}

export default function NewgroundsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1500px] px-6 pt-10"><div className="skeleton h-56 w-full" /></div>}>
      <HubClient />
    </Suspense>
  );
}
