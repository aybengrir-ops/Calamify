"use client";

import React, { useState, useEffect } from "react";

export const OfflineBanner = () => {
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateOnlineStatus = () => {
      if (typeof window !== "undefined") {
        setIsOffline(!navigator.onLine);
      }
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
      }
    };
  }, []);

  if (!mounted || !isOffline) {
    return null;
  }

  return (
    <div className="fixed top-16 inset-x-0 z-[75] flex justify-center pointer-events-none px-3">
      <div className="bg-[#0d1b2a]/90 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-xl backdrop-blur-md animate-pulse pointer-events-auto">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <span>📡 Mode Offline — Kat-stama3 l-moussiqa m-téléchargiya</span>
      </div>
    </div>
  );
};

export default OfflineBanner;