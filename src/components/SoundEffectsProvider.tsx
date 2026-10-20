"use client";

import { useEffect } from "react";
import { usePlayer } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import {
  playBassDrop,
  playClick,
  playError,
  playHover,
  playLike,
  playNext,
  playNotification,
  playPauseSound,
  playPrev,
  playSwoosh,
  setSoundMuted,
  startAmbient,
  stopAmbient,
} from "@/lib/soundEffects";

const UI_SOUNDS_KEY = "calamify:ui-sounds";
const AMBIENT_KEY = "calamify:ambient";
const INTERACTIVE = 'button, a, [role="button"], .glass-btn, .glass-card, .track-card, .surah-card, .nasheed-card, .glass-reciter-card, .glass-surah-card, input, select, .lyric-synced-line';

function readPref(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw === null ? fallback : raw === "1";
}

/**
 * Attaches the synthesized sound engine to the whole app:
 * hover/click on any interactive element, bass drop on play, reverse sweep on
 * pause, arpeggios on next/prev, warm chord on like, glitch on stream error,
 * ping on notifications, swoosh on route changes, plus the optional ambient
 * space drone. Everything is Web Audio – no files, no requests.
 */
export function SoundEffectsProvider() {
  useEffect(() => {
    const enabled = readPref(UI_SOUNDS_KEY, true);
    setSoundMuted(!enabled);

    if (readPref(AMBIENT_KEY, false) && enabled) {
      const start = () => {
        startAmbient();
        document.removeEventListener("pointerdown", start);
        document.removeEventListener("keydown", start);
      };
      document.addEventListener("pointerdown", start);
      document.addEventListener("keydown", start);
      return () => {
        document.removeEventListener("pointerdown", start);
        document.removeEventListener("keydown", start);
        stopAmbient();
      };
    }
  }, []);

  /* delegated hover + click */
  useEffect(() => {
    let lastHoverTarget: EventTarget | null = null;
    const onOver = (e: PointerEvent) => {
      if (!readPref(UI_SOUNDS_KEY, true)) return;
      const target = (e.target as HTMLElement | null)?.closest?.(INTERACTIVE);
      if (!target || target === lastHoverTarget) return;
      lastHoverTarget = target;
      playHover();
    };
    const onOut = () => (lastHoverTarget = null);
    const onClick = (e: MouseEvent) => {
      if (!readPref(UI_SOUNDS_KEY, true)) return;
      const target = (e.target as HTMLElement | null)?.closest?.(INTERACTIVE);
      if (target) playClick();
    };
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  /* player transitions */
  useEffect(() => {
    let prevPlaying = usePlayer.getState().playing;
    let prevIndex = usePlayer.getState().index;
    let prevStatus = usePlayer.getState().status;
    let prevTrack: string | null = usePlayer.getState().current?.id ?? null;

    return usePlayer.subscribe((state) => {
      if (!readPref(UI_SOUNDS_KEY, true)) {
        prevPlaying = state.playing;
        prevIndex = state.index;
        prevStatus = state.status;
        prevTrack = state.current?.id ?? null;
        return;
      }
      const trackId = state.current?.id ?? null;
      const trackChanged = trackId !== prevTrack;

      if (state.playing && !prevPlaying) {
        // new track → bass drop, resuming the same track → softer sweep
        if (trackChanged) playBassDrop();
        else playSwoosh();
      } else if (!state.playing && prevPlaying) {
        playPauseSound();
      }

      if (trackChanged && !state.playing && prevIndex !== state.index) {
        if (state.index > prevIndex) playNext();
        else if (state.index < prevIndex) playPrev();
      } else if (trackChanged && state.playing && prevIndex !== state.index) {
        if (state.index > prevIndex) playNext();
        else if (state.index < prevIndex) playPrev();
      }

      if (state.status === "error" && prevStatus !== "error") playError();

      prevPlaying = state.playing;
      prevIndex = state.index;
      prevStatus = state.status;
      prevTrack = trackId;
    });
  }, []);

  /* likes */
  useEffect(() => {
    let prevCount = useSession.getState().likes.length;
    return useSession.subscribe((state) => {
      if (state.likes.length !== prevCount) {
        if (state.likes.length > prevCount && readPref(UI_SOUNDS_KEY, true)) playLike();
        prevCount = state.likes.length;
      }
    });
  }, []);

  /* toasts that look like alerts + notification bell */
  useEffect(() => {
    let prevToasts = useUi.getState().toasts.length;
    let prevUnread = useSession.getState().notifications.filter((n) => !n.read).length;
    return useUi.subscribe((state) => {
      const enabled = readPref(UI_SOUNDS_KEY, true);
      if (state.toasts.length > prevToasts && enabled) {
        const latest = state.toasts[state.toasts.length - 1];
        if (latest?.tone === "error") playError();
        else playSwoosh();
      }
      prevToasts = state.toasts.length;
      const unread = useSession.getState().notifications.filter((n) => !n.read).length;
      if (unread > prevUnread && enabled) playNotification();
      prevUnread = unread;
    });
  }, []);

  return null;
}

/** Toggle helpers used by the Settings page. */
export function setUiSounds(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UI_SOUNDS_KEY, enabled ? "1" : "0");
  setSoundMuted(!enabled);
}

export function setAmbientDrone(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AMBIENT_KEY, enabled ? "1" : "0");
  if (enabled) startAmbient();
  else stopAmbient();
}

export function getUiSounds() {
  return readPref(UI_SOUNDS_KEY, true);
}

export function getAmbientDrone() {
  return readPref(AMBIENT_KEY, false);
}
