"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/cn";

/** PWA registration, install prompt, session hydration, theme + easter eggs. */
export function AppShell() {
  const { refresh, settings, user } = useSession();
  const { setInstallPrompt, installPrompt, toast } = useUi();
  const [ship, setShip] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100, visible: false });

  useEffect(() => {
    void refresh();
    const localHistory = typeof window !== "undefined" ? window.localStorage.getItem("calamify:local-history") : null;
    if (localHistory) {
      try {
        const parsed = JSON.parse(localHistory);
        if (Array.isArray(parsed) && parsed.length && !useSession.getState().history.length) {
          useSession.setState({ history: parsed.slice(0, 60) });
        }
      } catch {
        /* ignore */
      }
    }
  }, [refresh]);

  // OAuth redirect result (?auth=ok / ?autherror=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("auth");
    const err = params.get("autherror");
    if (ok) toast("Signed in - your library is syncing", "success");
    if (err) toast("Sign-in failed: " + err.replace(/_/g, " "), "error");
    if (ok || err) {
      params.delete("auth");
      params.delete("autherror");
      const qs = params.toString();
      window.history.replaceState({}, "", qs ? "?" + qs : window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  // install prompt
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [setInstallPrompt]);

  // theme from settings
  useEffect(() => {
    const body = document.body;
    body.classList.toggle("light-mode", settings?.theme === "space-light");
    body.classList.toggle("reduced-motion", Boolean(settings?.reducedMotion));
    if (settings?.reducedMotion) useUi.getState().setReducedMotion(true);
  }, [settings?.theme, settings?.reducedMotion]);

  // konami code → spaceship
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === seq[idx].toLowerCase()) {
        idx += 1;
        if (idx === seq.length) {
          idx = 0;
          setShip(true);
          toast("🚀 Warp drive engaged", "success");
          setTimeout(() => setShip(false), 5200);
        }
      } else idx = 0;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);

  // custom cursor (pointer devices only)
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY, visible: true });
    const leave = () => setCursor((c) => ({ ...c, visible: false }));
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  const install = async () => {
    const prompt = installPrompt;
    if (!prompt) {
      toast("Use your browser menu → “Install app” to add Calamify to your device", "info");
      return;
    }
    prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice?.outcome === "accepted") toast("Calamify installed 🌌", "success");
    setInstallPrompt(null);
  };

  return (
    <>
      {installPrompt && (
        <button onClick={install} className="glass-btn glass-btn-primary fixed bottom-28 left-1/2 z-[45] flex -translate-x-1/2 items-center gap-2 !rounded-full px-4 py-2.5 text-xs font-semibold shadow-2xl sm:left-6 sm:translate-x-0">
          <Download className="h-4 w-4" /> Install Calamify
        </button>
      )}

      {ship && (
        <div className="pointer-events-none fixed inset-0 z-[99] overflow-hidden">
          <MotionShip />
        </div>
      )}

      <div
        className={cn("pointer-events-none fixed z-[100] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_16px_6px_rgba(0,212,255,0.55)] md:block", !cursor.visible && "opacity-0")}
        style={{ left: cursor.x, top: cursor.y, transition: "opacity .3s" }}
        aria-hidden
      />
      <div
        className={cn("pointer-events-none fixed z-[99] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/40 md:block", !cursor.visible && "opacity-0")}
        style={{ left: cursor.x, top: cursor.y, transition: "left .18s ease-out, top .18s ease-out, opacity .3s" }}
        aria-hidden
      />
      {user && <span className="sr-only" aria-live="polite">Signed in as {user.displayName}</span>}
    </>
  );
}

function MotionShip() {
  return (
    <div className="absolute left-[-20vw] top-[70vh] text-5xl" style={{ animation: "shooting 5s ease-in-out forwards" }}>
      🚀
    </div>
  );
}
