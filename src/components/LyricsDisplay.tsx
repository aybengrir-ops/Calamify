"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { lyricsApi } from "@/lib/api";
import { usePlayer } from "@/store/player";
import { getAudioElement, audioTime } from "@/lib/audioRef";
import { activeLineIndex, applyOffset, formatLyricTime, synthesizeWordTimings, wordProgress, type LyricLine } from "@/lib/lyrics";

const OFFSET_KEY = "calamify:lyrics-offset:";

function readOffset(songId: string): number {
  try {
    const raw = window.localStorage.getItem(OFFSET_KEY + songId);
    const v = raw ? parseFloat(raw) : 0;
    return isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/**
 * Karaoke lyrics.
 *
 *  · words light up one by one using per-word start/end timestamps
 *  · timing is read from the <audio> element every animation frame, so the
 *    highlight follows the track's real speed (and any playback-rate change)
 *    rather than a wall-clock estimate
 *  · manual ±0.1 s sync offset per track, persisted
 *  · click a word or line to seek there
 */
export function LyricsDisplay({ compact = false }: { compact?: boolean }) {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const storePosition = usePlayer((s) => s.position);
  const rate = usePlayer((s) => s.rate);
  const seek = usePlayer((s) => s.seek);

  const [raw, setRaw] = useState<LyricLine[]>([]);
  const [plain, setPlain] = useState("");
  const [found, setFound] = useState(false);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const autoScroll = useRef(true);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    setRaw([]);
    setPlain("");
    setFound(false);
    if (!current) return;
    setOffset(readOffset(current.id));
    setLoading(true);
    lyricsApi(current.title, current.artist)
      .then((d: any) => {
        if (!alive) return;
        setRaw(d.lyrics || []);
        setPlain(d.plain || "");
        setFound(Boolean(d.found));
        setSource(d.source || "");
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [current?.id]);

  /** word timings: real karaoke tags when present, otherwise estimated per line */
  const lines = useMemo(() => applyOffset(synthesizeWordTimings(raw), offset), [raw, offset]);
  const active = useMemo(() => activeLineIndex(lines, time), [lines, time]);

  // frame-accurate clock while playing; falls back to the store position when paused
  useEffect(() => {
    if (!playing) {
      setTime(storePosition);
      return;
    }
    let raf = 0;
    const tick = () => {
      const el = getAudioElement();
      setTime(el && isFinite(el.currentTime) ? el.currentTime : audioTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, storePosition, current?.id]);

  useEffect(() => {
    if (!autoScroll.current || active < 0 || !boxRef.current) return;
    const el = boxRef.current.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!el) return;
    const box = boxRef.current;
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2), behavior: "smooth" });
  }, [active]);

  const onScroll = () => {
    autoScroll.current = false;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      autoScroll.current = true;
    }, 5000);
  };

  const nudge = (delta: number) => {
    if (!current) return;
    const next = Math.round((offset + delta) * 100) / 100;
    setOffset(next);
    try {
      window.localStorage.setItem(OFFSET_KEY + current.id, String(next));
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className={`lyrics-container glass-lyrics ${compact ? "compact" : ""}`}>
        <div className="lyrics-loading-state">
          <div className="lyrics-orbit-loader">
            <div className="orbit-ring">
              <span className="orbit-planet p1" />
              <span className="orbit-planet p2" />
              <span className="orbit-planet p3" />
            </div>
          </div>
          <p className="lyrics-loading-text">Searching the cosmos for lyrics…</p>
        </div>
      </div>
    );
  }

  const syncBar = (
    <div className="lyrics-sync-bar">
      <span className="lyrics-sync-label">Sync</span>
      <button onClick={() => nudge(-0.1)} aria-label="Lyrics 0.1s earlier" title="0.1s earlier">
        <Minus className="h-3 w-3" />
      </button>
      <span className="lyrics-sync-value">{offset > 0 ? "+" : ""}{offset.toFixed(2)}s</span>
      <button onClick={() => nudge(0.1)} aria-label="Lyrics 0.1s later" title="0.1s later">
        <Plus className="h-3 w-3" />
      </button>
      <button
        onClick={() => {
          setOffset(0);
          if (current) {
            try {
              window.localStorage.removeItem(OFFSET_KEY + current.id);
            } catch {
              /* ignore */
            }
          }
        }}
        aria-label="Reset lyric sync"
        title="Reset sync"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
      {rate !== 1 && <span className="lyrics-sync-rate">{rate}× speed · words follow the audio clock</span>}
    </div>
  );

  if (!found || (!lines.length && !plain)) {
    return (
      <div className={`lyrics-container glass-lyrics ${compact ? "compact" : ""}`}>
        <div className="lyrics-empty-state">
          <span className="lyrics-empty-icon">🌌</span>
          <p>No lyrics found in this galaxy</p>
          <p className="lyrics-empty-sub">{current ? `Nothing archived for “${current.title}” — try another track` : "Play a track to load its lyrics"}</p>
        </div>
      </div>
    );
  }

  if (lines.length) {
    return (
      <div className={`lyrics-container glass-lyrics synced ${compact ? "compact" : ""}`} ref={boxRef} onScroll={onScroll} onDoubleClick={() => (autoScroll.current = true)}>
        <div className="lyrics-fade-top" />
        <div className="lyrics-lines">
          <div className="lyrics-spacer" />
          {lines.map((line, i) => {
            const state = i === active ? "active" : i < active ? "past" : "upcoming";
            const words = line.words?.length ? line.words : [{ text: line.text, start: line.time, end: line.time + 1.5 }];
            return (
              <div key={`${line.time}-${i}`} data-index={i} className={`lyric-synced-line ${state}`} title="Seek to this line">
                <span className="lyric-text-content">
                  {words.map((w, wi) => {
                    const p = i === active ? wordProgress(w, time) : i < active ? 1 : 0;
                    return (
                      <span
                        key={wi}
                        className="lyric-word"
                        style={{ ["--p" as string]: `${Math.round(p * 100)}%` }}
                        onClick={() => seek(Math.max(0, w.start))}
                      >
                        {w.text}
                      </span>
                    );
                  })}
                </span>
                {i === active && <span className="lyric-active-glow" />}
              </div>
            );
          })}
          <div className="lyrics-spacer" />
        </div>
        <div className="lyrics-fade-bottom" />
        <div className="lyrics-footer">
          {syncBar}
          <span className="lyrics-credit">
            {lines.some((l) => l.wordsAreExact) ? "Karaoke timestamps" : "Word timing estimated"} · {source}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`lyrics-container glass-lyrics plain ${compact ? "compact" : ""}`} ref={boxRef}>
      <div className="lyrics-fade-top" />
      <div className="lyrics-plain-lines">
        {plain.split("\n").map((line, i) => (
          <p key={i} className="lyric-plain-line" style={{ animationDelay: `${Math.min(i * 0.03, 3)}s` }}>
            {line || "\u00A0"}
          </p>
        ))}
      </div>
      <div className="lyrics-fade-bottom" />
      <div className="lyrics-footer">
        {syncBar}
        <span className="lyrics-credit">Plain lyrics · {source}</span>
      </div>
    </div>
  );
}
