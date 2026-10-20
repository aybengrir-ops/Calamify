"use client";

import { create } from "zustand";
import type { Song } from "@/lib/types";

export interface Toast {
  id: string;
  message: string;
  tone?: "info" | "success" | "error";
  actionLabel?: string;
  action?: () => void;
}

interface ContextMenuState {
  song: Song | null;
  x: number;
  y: number;
  context?: Song[];
}

interface UiState {
  toasts: Toast[];
  contextMenu: ContextMenuState;
  authOpen: boolean;
  authMode: "login" | "signup";
  mobileNav: boolean;
  notificationsOpen: boolean;
  addToPlaylistSong: Song | null;
  createPlaylistOpen: boolean;
  installPrompt: any | null;
  reducedMotion: boolean;

  toast: (message: string, tone?: Toast["tone"], action?: { label: string; onClick: () => void }) => void;
  dismissToast: (id: string) => void;
  openContextMenu: (song: Song, x: number, y: number, context?: Song[]) => void;
  closeContextMenu: () => void;
  setAuthOpen: (open: boolean, mode?: "login" | "signup") => void;
  setMobileNav: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setAddToPlaylistSong: (song: Song | null) => void;
  setCreatePlaylistOpen: (open: boolean) => void;
  setInstallPrompt: (p: any) => void;
  setReducedMotion: (b: boolean) => void;
}

export const useUi = create<UiState>((set, get) => ({
  toasts: [],
  contextMenu: { song: null, x: 0, y: 0 },
  authOpen: false,
  authMode: "login",
  mobileNav: false,
  notificationsOpen: false,
  addToPlaylistSong: null,
  createPlaylistOpen: false,
  installPrompt: null,
  reducedMotion: false,

  toast: (message, tone = "info", action) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set({ toasts: [...get().toasts, { id, message, tone, actionLabel: action?.label, action: action?.onClick }].slice(-4) });
    setTimeout(() => get().dismissToast(id), action ? 6000 : 3800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  openContextMenu: (song, x, y, context) => set({ contextMenu: { song, x, y, context } }),
  closeContextMenu: () => set({ contextMenu: { song: null, x: 0, y: 0 } }),
  setAuthOpen: (open, mode) => set({ authOpen: open, authMode: mode || get().authMode }),
  setMobileNav: (open) => set({ mobileNav: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  setAddToPlaylistSong: (song) => set({ addToPlaylistSong: song }),
  setCreatePlaylistOpen: (open) => set({ createPlaylistOpen: open }),
  setInstallPrompt: (p) => set({ installPrompt: p }),
  setReducedMotion: (b) => set({ reducedMotion: b }),
}));
