"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/cn";

export function Toasts() {
  const { toasts, dismissToast } = useUi();
  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[90] flex w-[min(94vw,420px)] -translate-x-1/2 flex-col gap-2 sm:bottom-32 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn(
              "glass-strong pointer-events-auto flex items-start gap-3 p-3",
              t.tone === "success" && "border-emerald-300/40",
              t.tone === "error" && "border-pink-300/50"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {t.tone === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              ) : t.tone === "error" ? (
                <AlertTriangle className="h-4 w-4 text-pink-300" />
              ) : (
                <Info className="h-4 w-4 text-cyan-300" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-snug text-white/90">{t.message}</p>
              {t.actionLabel && t.action && (
                <button
                  onClick={() => {
                    t.action?.();
                    dismissToast(t.id);
                  }}
                  className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 hover:text-white"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="shrink-0 text-white/40 transition hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
