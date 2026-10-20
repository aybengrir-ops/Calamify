import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="glass-strong relative overflow-hidden p-10">
        <span className="animate-float absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-400/30 blur-3xl" />
        <p className="text-6xl">🛸</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white">404 — Lost in space</h1>
        <p className="mt-3 text-sm text-white/60">This coordinate does not exist in the Calamify star map. Let&apos;s get you back to the music.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="glass-btn glass-btn-primary !rounded-full px-5 py-2.5 text-sm">Back home</Link>
          <Link href="/trending" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Trending now</Link>
          <Link href="/explore" className="glass-btn !rounded-full px-5 py-2.5 text-sm">Explore genres</Link>
        </div>
      </div>
    </div>
  );
}
