"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlanetMark } from "@/components/Navbar";

/** First-paint loading screen: logo + orbit animation. */
export function Splash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-[#05060f]">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <span className="animate-orbit absolute inset-0 rounded-full border border-cyan-300/30" />
            <span className="animate-orbit absolute inset-3 rounded-full border border-violet-300/25" style={{ animationDuration: "9s", animationDirection: "reverse" }} />
            <span className="animate-orbit absolute -inset-4 rounded-full border border-pink-300/15" style={{ animationDuration: "18s" }} />
            <PlanetMark size={54} />
            <span className="absolute -right-1 top-2 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(0,212,255,1)]" />
          </div>
          <div className="text-center">
            <p className="logo-glow text-gradient font-display text-3xl font-bold">Calamify</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.4em] text-white/40">Loading the universe</p>
          </div>
          <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-pink-500" initial={{ width: "8%" }} animate={{ width: "92%" }} transition={{ duration: 1.4, ease: "easeInOut" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
