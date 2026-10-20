"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePlayer, audioUrl } from "@/store/player";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { attachAnalyser, resumeAudioContext } from "@/lib/visualizer";
import { setAudioElement } from "@/lib/audioRef";
import { useOffline } from "@/store/offline";
import { warmList } from "@/lib/preloader";
import { radioApi } from "@/lib/api";
import type { Song } from "@/lib/types";

const START_TIMEOUT = 8000; // never spin forever
const STALL_INTERVAL = 12000; // check for progress every 12s
const MAX_ERRORS = 3; // only give up on a track after 3 real failures

/**
 * The single <audio> element that powers Calamify.
 *
 * Fixes baked in here:
 *  · seeking while paused works (we never auto-play on a seek) and is clamped
 *    to `duration - 0.5s` so a scrub to the end can't fire `ended`
 *  · an `isSeeking` guard stops a user scrub from auto-advancing the queue
 *  · transient errors/buffer underruns recover by reloading the SAME source;
 *    we only escalate after MAX_ERRORS real failures
 *  · duration is taken from the element (`loadedmetadata`/`durationchange`),
 *    so tracks whose catalogue duration is 0 (Quran, Newgrounds) still scrub
 *  · the source is always our own /api/audio proxy – never a CDN URL
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attempts = useRef(0);
  const errorCount = useRef(0);
  const stallStrikes = useRef(0);
  const isSeeking = useRef(false);
  const seekTimer = useRef<number | null>(null);
  const stallTimer = useRef<number | null>(null);
  const startTimer = useRef<number | null>(null);
  const lastPosition = useRef(0);
  const listenedSeconds = useRef(0);
  const lastTickAt = useRef(Date.now());
  const reportedRef = useRef<string | null>(null);
  const offlineSrc = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const seekPending = useRef<number | null>(null);
  const lastSeekToken = useRef(-1);
  const forceTimer = useRef<number | null>(null);

  const current = usePlayer((s) => s.current);
  const srcVersion = usePlayer((s) => s.srcVersion);
  const playing = usePlayer((s) => s.playing);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const rate = usePlayer((s) => s.rate);

  const clearTimers = useCallback(() => {
    if (startTimer.current) window.clearTimeout(startTimer.current);
    if (stallTimer.current) window.clearInterval(stallTimer.current);
    startTimer.current = null;
    stallTimer.current = null;
  }, []);

  const markSeeking = useCallback(() => {
    isSeeking.current = true;
    if (seekTimer.current) window.clearTimeout(seekTimer.current);
    seekTimer.current = window.setTimeout(() => {
      isSeeking.current = false;
    }, 1200);
  }, []);

  /* ---------------- escalation chain ---------------- */
  const failover = useCallback(
    async (reason: string) => {
      const store = usePlayer.getState();
      const song = store.current;
      if (!song) return;
      attempts.current += 1;
      clearTimers();

      // 1/3 – re-resolve the upstream and try the same track again
      if (attempts.current === 1) {
        useUi.getState().toast("Re-routing stream… (1/3)", "info");
        store._setStatus("loading");
        const el = audioRef.current;
        if (el) {
          el.src = `${audioUrl(song, { version: store.srcVersion + 1 })}&alt=1`;
          el.load();
          armStartTimer();
        }
        return;
      }

      // 2/3 – play a similar full-length track instead
      if (attempts.current === 2) {
        try {
          const data = await radioApi({ title: song.title, artist: song.artist, genre: song.genre, exclude: [song.id] });
          const alt = (data.results || []).find((s: Song) => s.source === "audius") || (data.results || [])[0];
          if (alt) {
            useUi.getState().toast(`Stream unavailable (${reason}) — playing “${alt.title}” instead`, "info");
            attempts.current = 0;
            errorCount.current = 0;
            store.playSong(alt, [alt, ...store.queue.filter((q) => q.id !== alt.id)]);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      // 3/3 – skip ahead (or stop cleanly at the end of the queue)
      if (store.queue.length > store.index + 1) {
        useUi.getState().toast(`Skipping — “${song.title}” would not stream`, "error");
        attempts.current = 0;
        errorCount.current = 0;
        store.next(true);
      } else {
        store._setStatus("error");
        store._setPlaying(false);
        useUi.getState().toast(`Could not stream “${song.title}”. Try another track.`, "error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimers]
  );

  const armStartTimer = useCallback(() => {
    if (startTimer.current) window.clearTimeout(startTimer.current);
    startTimer.current = window.setTimeout(() => {
      const el = audioRef.current;
      if (!el) return;
      if (el.readyState < 3 && usePlayer.getState().status === "loading") void failover("upstream timeout");
    }, START_TIMEOUT);
  }, [failover]);

  /* ---------------- source changes (offline first) ---------------- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    attempts.current = 0;
    errorCount.current = 0;
    stallStrikes.current = 0;
    isSeeking.current = false;
    pendingSeek.current = null;
    usePlayer.getState()._setPendingSeekPercent(null);
    listenedSeconds.current = 0;
    lastTickAt.current = Date.now();
    clearTimers();

    let cancelled = false;
    (async () => {
      // 1) IndexedDB copy wins – no network, instant, works offline
      const localUrl = await useOffline.getState().blobUrlFor(current.id).catch(() => null);
      if (cancelled) return;
      if (localUrl) {
        offlineSrc.current = true;
        el.src = localUrl;
      } else {
        offlineSrc.current = false;
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          usePlayer.getState()._setStatus("error");
          usePlayer.getState()._setPlaying(false);
          useUi.getState().toast(`Offline — “${current.title}” is not downloaded yet`, "error");
          return;
        }
        // 2) our own proxy (never a CDN url)
        el.src = audioUrl(current, { version: srcVersion });
      }

      el.load();
      usePlayer.getState()._setStatus("loading");
      usePlayer.getState()._setDuration(current.duration || 0);
      armStartTimer();

      const state = usePlayer.getState();
      const upcoming = state.queue.slice(state.index + 1, state.index + 3);
      if (upcoming.length && navigator.onLine) warmList(upcoming, 2);

      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: current.title,
            artist: current.artist,
            album: current.album || "Calamify",
            artwork: current.thumbnail ? [{ src: current.thumbnail, sizes: "480x480", type: "image/jpeg" }] : [],
          });
        } catch {
          /* ignore */
        }
      }
      if (typeof document !== "undefined") document.title = `${current.title} · ${current.artist} — Calamify`;
    })();

    return () => {
      cancelled = true;
    };
    // queue/index intentionally excluded: queue edits must not restart the song
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, srcVersion]);

  /* ---------------- play / pause ---------------- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (playing) {
      attachAnalyser(el);
      void resumeAudioContext();
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, [playing, current?.id, srcVersion]);

  /* ---------------- volume ---------------- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /* ---------------- element handle + playback speed ---------------- */
  useEffect(() => {
    setAudioElement(audioRef.current);
    return () => setAudioElement(null);
  }, []);

  // Applied on mount, on rate change and after every source swap so the
  // speed survives track changes (and lyric timing keeps following it).
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.playbackRate = rate;
    } catch {
      /* ignore */
    }
  }, [rate, current?.id, srcVersion]);

  /** Apply a seek that arrived before the element knew its duration. */
  const applyPendingSeek = useCallback(() => {
    const el = audioRef.current;
    if (!el) return false;
    const store = usePlayer.getState();
    const dur = el.duration && isFinite(el.duration) ? el.duration : 0;
    if (!dur) return false;

    let target = pendingSeek.current;
    const pct = store.pendingSeekPercent;
    if (target === null && pct !== null) target = (pct / 100) * dur;
    if (target === null || !isFinite(target)) return false;

    const clamped = Math.max(0, Math.min(target, dur - 0.5));
    pendingSeek.current = null;
    if (pct !== null) store._setPendingSeekPercent(null);
    markSeeking();
    try {
      el.currentTime = clamped;
    } catch {
      return false;
    }
    store._setPosition(clamped);
    store._setDuration(dur);
    // a paused track stays paused – seeking never starts playback
    if (!store.playing) el.pause();
    return true;
  }, [markSeeking]);

  /**
   * Force the browser to fetch metadata so a seek can land. Some mobile
   * browsers refuse to load anything until playback starts, so as a last
   * resort we play silently for a beat, then restore the paused state.
   */
  const forceLoadMetadata = useCallback(() => {
    const el = audioRef.current;
    if (!el || !el.src) return;
    try {
      el.load();
    } catch {
      /* ignore */
    }
    if (forceTimer.current) window.clearTimeout(forceTimer.current);
    forceTimer.current = window.setTimeout(() => {
      const node = audioRef.current;
      if (!node) return;
      const ready = node.duration && isFinite(node.duration) && node.duration > 0;
      const wanted = pendingSeek.current !== null || usePlayer.getState().pendingSeekPercent !== null;
      if (ready || !wanted) return;
      const store = usePlayer.getState();
      const prevVolume = node.volume;
      node.volume = 0;
      node
        .play()
        .then(() => {
          node.pause();
          node.volume = prevVolume;
          if (!store.playing) node.pause();
          applyPendingSeek();
        })
        .catch(() => {
          node.volume = prevVolume;
        });
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- seek sync (works while paused) ---------------- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const store = usePlayer.getState();
    const target = store.position;
    if (typeof target !== "number" || isNaN(target) || !isFinite(target)) return;

    const isUserSeek = store.seekToken !== lastSeekToken.current;
    if (isUserSeek) lastSeekToken.current = store.seekToken;

    const elDur = el.duration && isFinite(el.duration) ? el.duration : 0;
    const known = elDur || (isFinite(store.duration) && store.duration > 0 ? store.duration : 0);

    // Duration still unknown → remember the target and force-load the metadata.
    if (!known) {
      if (target > 0 || isUserSeek) pendingSeek.current = target;
      forceLoadMetadata();
      return;
    }

    const clamped = Math.max(0, Math.min(target, Math.max(0, known - 0.15)));
    // A user scrub is applied even while playing, and even for small deltas –
    // timeupdate must never win the race against the scrubber.
    if (isUserSeek || Math.abs(el.currentTime - clamped) > 1.2) {
      markSeeking();
      seekPending.current = clamped;
      try {
        el.currentTime = clamped;
        if (Math.abs(clamped - target) > 0.4) store._setPosition(clamped);
        if (seekTimer.current) window.clearTimeout(seekTimer.current);
        seekTimer.current = window.setTimeout(() => {
          seekPending.current = null; // non-seekable source: stop blocking timeupdate
        }, 1500);
      } catch {
        seekPending.current = null;
        pendingSeek.current = clamped;
        forceLoadMetadata();
      }
    }
  });

  /* ---------------- stall watchdog (forgiving) ---------------- */
  useEffect(() => {
    if (!playing) return;
    lastPosition.current = audioRef.current?.currentTime ?? 0;
    stallTimer.current = window.setInterval(() => {
      const el = audioRef.current;
      if (!el || el.paused || isSeeking.current) return;
      const now = el.currentTime;
      if (Math.abs(now - lastPosition.current) < 0.05) {
        stallStrikes.current += 1;
        // two consecutive silent checks (~24s) before we escalate
        if (stallStrikes.current >= 2 && el.readyState < 4) void failover("stream stalled");
      } else {
        stallStrikes.current = 0;
      }
      lastPosition.current = now;
    }, STALL_INTERVAL);
    return () => {
      if (stallTimer.current) window.clearInterval(stallTimer.current);
    };
  }, [playing, current?.id, failover]);

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      const store = usePlayer.getState();
      if (!store.current) return;
      const limit = store.duration || store.current.duration || 0;
      const jump = (delta: number) => store.seek(Math.max(0, Math.min(limit ? limit - 0.5 : 0, store.position + delta)));
      switch (e.key.toLowerCase()) {
        case "arrowleft":
        case "j":
          e.preventDefault();
          jump(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          // Shift+L toggles the lyrics panel, plain L still seeks +10s
          if (e.shiftKey) store.setLyricsOpen(!store.lyricsOpen);
          else jump(10);
          break;
        case "arrowup":
          e.preventDefault();
          store.setVolume(Math.min(1, store.volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          store.setVolume(Math.max(0, store.volume - 0.1));
          break;
        case "b":
          jump(-30);
          break;
        case "f":
          jump(30);
          break;
        case " ":
          if (tag !== "BUTTON") {
            e.preventDefault();
            store.toggle();
          }
          break;
        case "m":
          store.toggleMute();
          break;
        case "]":
          e.preventDefault();
          store.cycleRate();
          break;
        case "[": {
          e.preventDefault();
          const rates = [0.75, 1, 1.25, 1.5, 2];
          const i = rates.indexOf(store.rate);
          store.setRate(rates[(i - 1 + rates.length) % rates.length]);
          break;
        }
        case "q":
          store.setQueueOpen(!store.queueOpen);
          break;
        case "s":
          store.setShuffle(!store.shuffle);
          break;
        case "r":
          store.cycleRepeat();
          break;
        case "x":
          store.setExpanded(!store.expanded);
          break;
        case "escape":
          if (store.expanded) store.setExpanded(false);
          else if (store.queueOpen) store.setQueueOpen(false);
          else if (store.lyricsOpen) store.setLyricsOpen(false);
          break;
        case "n":
          store.next();
          break;
        case "p":
          store.prev();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------------- media session ---------------- */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const s = usePlayer.getState();
    navigator.mediaSession.setActionHandler("play", () => s.toggle());
    navigator.mediaSession.setActionHandler("pause", () => s.toggle());
    navigator.mediaSession.setActionHandler("previoustrack", () => s.prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => s.next());
    try {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") s.seek(details.seekTime);
      });
    } catch {
      /* unsupported */
    }
  }, []);

  /* ---------------- element events ---------------- */
  const onTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    const store = usePlayer.getState();
    const delta = Date.now() - lastTickAt.current;
    lastTickAt.current = Date.now();
    if (!el.paused) listenedSeconds.current += Math.min(delta, 2000) / 1000;
    // while a scrub is landing, keep the user's target on screen
    if (seekPending.current === null) store._setPosition(el.currentTime);
    if (el.duration && isFinite(el.duration) && Math.abs(el.duration - store.duration) > 0.5) store._setDuration(el.duration);
  };

  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    const store = usePlayer.getState();
    if (el.duration && isFinite(el.duration)) store._setDuration(el.duration);
    // 1) a queued pending seek (absolute seconds or percent) wins
    if (applyPendingSeek()) return;
    // 2) otherwise honour whatever position the UI already shows
    if (store.position > 0 && Math.abs(el.currentTime - store.position) > 1.2) {
      markSeeking();
      try {
        el.currentTime = Math.min(store.position, Math.max(0, (el.duration || store.position) - 0.5));
      } catch {
        /* ignore */
      }
    }
  };

  const onProgress = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    if (el.buffered.length) usePlayer.getState()._setBuffered(el.buffered.end(el.buffered.length - 1));
  };

  const onCanPlay = () => {
    clearTimers();
    const store = usePlayer.getState();
    store._setStatus("ready");
    applyPendingSeek();
    if (store.playing) {
      attachAnalyser(audioRef.current);
      void resumeAudioContext();
      audioRef.current?.play().catch(() => undefined);
    }
  };

  const onPlaying = () => {
    clearTimers();
    errorCount.current = 0;
    stallStrikes.current = 0;
    usePlayer.getState()._setStatus("ready");
    usePlayer.getState()._setPlaying(true);
    const song = usePlayer.getState().current;
    if (song && reportedRef.current !== song.id) {
      reportedRef.current = song.id;
      void reportSource(song);
    }
  };

  /** Ask the proxy which upstream is actually feeding the element. */
  const reportSource = async (song: Song) => {
    try {
      const res = await fetch(audioUrl(song), { method: "HEAD" });
      const source = res.headers.get("x-calamify-source") || "";
      if (source.includes("alternative")) {
        const t = decodeURIComponent(res.headers.get("x-calamify-title") || "");
        const a = decodeURIComponent(res.headers.get("x-calamify-artist") || "");
        usePlayer
          .getState()
          ._setFallback(`The original is rate-limited on our edge — playing a full-length version${t ? `: “${t}” by ${a}` : ""}`);
      } else if (source.includes("fallback")) {
        const t = decodeURIComponent(res.headers.get("x-calamify-title") || "");
        const a = decodeURIComponent(res.headers.get("x-calamify-artist") || "");
        if (t) usePlayer.getState()._setFallback(`Upstream throttled — switched to the full-length match “${t}” by ${a}`);
      } else if (source.includes("partial")) {
        // Only a throttled fragment is available here. Keep it audible for a
        // beat, then swap in a full-length equivalent instead of dying at ~1 min.
        usePlayer.getState()._setFallback("This track is rate-limited on our edge — finding a full-length version…");
        attempts.current = 1; // next failover step goes straight to a similar full-length track
        window.setTimeout(() => {
          const now = usePlayer.getState();
          if (now.current?.id === song.id) void failover("only a partial stream is available");
        }, 1500);
      }
    } catch {
      /* informational only */
    }
  };

  const onEnded = () => {
    // A scrub to the very end must not auto-advance the queue.
    if (isSeeking.current) {
      isSeeking.current = false;
      return;
    }
    const store = usePlayer.getState();
    const song = store.current;
    const el = audioRef.current;
    if (song && el && isFinite(el.duration) && el.currentTime < el.duration - 1.5) return;
    if (song && listenedSeconds.current > 5) {
      void useSession.getState().logPlay(song, Math.round(listenedSeconds.current));
      persistLocalHistory(song);
    }
    listenedSeconds.current = 0;
    store.next(true);
  };

  const onError = () => {
    const store = usePlayer.getState();
    const song = store.current;
    if (!song) return;
    if (offlineSrc.current) {
      store._setStatus("error");
      store._setPlaying(false);
      useUi.getState().toast(`The offline copy of “${song.title}” could not be decoded`, "error");
      return;
    }
    errorCount.current += 1;

    if (errorCount.current >= MAX_ERRORS) {
      errorCount.current = 0;
      void failover(`${MAX_ERRORS} consecutive errors`);
      return;
    }

    // Recover in place: reload the SAME source, restore position, keep the
    // play/pause state the user chose (never auto-play a paused track).
    const el = audioRef.current;
    if (!el) return;
    const resumeAt = el.currentTime || store.position || 0;
    const wasPlaying = store.playing;
    store._setStatus("loading");
    el.src = audioUrl(song, { version: store.srcVersion });
    el.load();
    const restore = () => {
      el.removeEventListener("loadedmetadata", restore);
      try {
        if (resumeAt > 0 && isFinite(el.duration)) el.currentTime = Math.min(resumeAt, Math.max(0, el.duration - 0.5));
      } catch {
        /* ignore */
      }
      if (wasPlaying) el.play().catch(() => undefined);
    };
    el.addEventListener("loadedmetadata", restore);
    armStartTimer();
    if (errorCount.current === 1) useUi.getState().toast("Stream hiccup — recovering…", "info");
  };

  const persistLocalHistory = (song: Song) => {
    try {
      const raw = window.localStorage.getItem("calamify:local-history");
      const list: { song: Song; playedAt: string }[] = raw ? JSON.parse(raw) : [];
      const next = [{ song, playedAt: new Date().toISOString() }, ...list.filter((l) => l.song.id !== song.id)].slice(0, 100);
      window.localStorage.setItem("calamify:local-history", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <audio
      ref={audioRef}
      preload="auto"
      crossOrigin="anonymous"
      className="hidden"
      onTimeUpdate={onTimeUpdate}
      onLoadedMetadata={onLoadedMetadata}
      onDurationChange={onLoadedMetadata}
      onProgress={onProgress}
      onCanPlay={onCanPlay}
      onPlaying={onPlaying}
      onPlay={() => usePlayer.getState()._setPlaying(true)}
      onPause={() => {
        // ignore the pause that accompanies `ended` and source-reload recovery
        if (audioRef.current?.ended || usePlayer.getState().status === "loading") return;
        usePlayer.getState()._setPlaying(false);
      }}
      onEnded={onEnded}
      onError={onError}
      onWaiting={() => usePlayer.getState()._setStatus("loading")}
      onRateChange={(e) => usePlayer.getState().setRate(e.currentTarget.playbackRate)}
      onSeeking={markSeeking}
      onSeeked={(e) => {
        const el = e.currentTarget;
        seekPending.current = null;
        isSeeking.current = false;
        if (isFinite(el.currentTime)) usePlayer.getState()._setPosition(el.currentTime);
      }}
    />
  );
}
