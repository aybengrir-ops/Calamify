/**
 * Lyrics timing utilities (isomorphic – used by the API route and the UI).
 *
 * Two levels of timing are supported:
 *  · line level  – classic LRC `[mm:ss.xx] text`
 *  · word level  – enhanced/karaoke LRC `[mm:ss.xx]<mm:ss.xx>word<mm:ss.xx>word`
 *
 * When a source only gives line timestamps we synthesise word timings by
 * distributing each word across the interval until the next line, weighted by
 * word length. Everything downstream is driven by the audio element's real
 * `currentTime`, so the highlight follows the track's actual speed (including
 * any playbackRate change) instead of a wall-clock guess.
 */

export interface LyricWord {
  text: string;
  start: number;
  end: number;
}

export interface LyricLine {
  time: number;
  text: string;
  /** present when the source ships karaoke tags, or after synthesis */
  words?: LyricWord[];
  /** true when `words` came from real timestamps rather than estimation */
  wordsAreExact?: boolean;
}

const LINE_RE = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/;
const WORD_RE = /<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>/g;

function toSeconds(min: string, sec: string, frac?: string): number {
  const ms = parseInt((frac || "0").padEnd(3, "0").slice(0, 3), 10);
  return parseInt(min, 10) * 60 + parseInt(sec, 10) + ms / 1000;
}

/** Parse LRC (with optional inline `<mm:ss.xx>` word timestamps). */
export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const out: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = LINE_RE.exec(line);
    if (!m) continue;
    const time = toSeconds(m[1], m[2], m[3]);
    const rest = m[4] || "";

    // karaoke tags inside the line → exact word timings
    const stamps: { at: number; index: number }[] = [];
    WORD_RE.lastIndex = 0;
    let wm: RegExpExecArray | null;
    while ((wm = WORD_RE.exec(rest)) !== null) stamps.push({ at: toSeconds(wm[1], wm[2], wm[3]), index: wm.index });

    if (stamps.length >= 2) {
      const words: LyricWord[] = [];
      for (let i = 0; i < stamps.length; i++) {
        const start = stamps[i].at;
        const textStart = stamps[i].index + (rest.slice(stamps[i].index).match(/^<[^>]*>/)?.[0].length || 0);
        const textEnd = i + 1 < stamps.length ? stamps[i + 1].index : rest.length;
        const text = rest.slice(textStart, textEnd).replace(/<[^>]*>/g, "").trim();
        const end = i + 1 < stamps.length ? stamps[i + 1].at : start + 0.6;
        if (text) words.push({ text, start, end: Math.max(end, start + 0.05) });
      }
      if (words.length) {
        out.push({ time: Math.min(time, words[0].start), text: words.map((w) => w.text).join(" "), words, wordsAreExact: true });
        continue;
      }
    }

    const text = rest.replace(/<[^>]*>/g, "").trim();
    out.push({ time, text });
  }
  return out.sort((a, b) => a.time - b.time).filter((l) => l.text);
}

/**
 * Distribute each line's words across [line.time, nextLine.time), weighted by
 * character count so long words take proportionally longer to sing. Leaves a
 * short breath at the end of the line.
 */
export function synthesizeWordTimings(lines: LyricLine[], opts: { maxLineSeconds?: number; breath?: number } = {}): LyricLine[] {
  const maxLine = opts.maxLineSeconds ?? 8;
  const breath = opts.breath ?? 0.28;
  return lines.map((line, i) => {
    if (line.words?.length) return line;
    const tokens = line.text.split(/\s+/).filter(Boolean);
    if (!tokens.length) return line;
    const next = lines[i + 1]?.time;
    const spanRaw = next !== undefined ? next - line.time : maxLine;
    const span = Math.max(0.6, Math.min(spanRaw || maxLine, maxLine)) - breath;
    const weights = tokens.map((t) => Math.max(2, t.replace(/[^a-z0-9]/gi, "").length || 2));
    const total = weights.reduce((a, b) => a + b, 0);
    let cursor = line.time;
    const words: LyricWord[] = tokens.map((text, idx) => {
      const dur = (weights[idx] / total) * span;
      const word = { text, start: cursor, end: cursor + dur };
      cursor += dur;
      return word;
    });
    return { ...line, words, wordsAreExact: false };
  });
}

/** Shift every timestamp by `offset` seconds (manual sync correction). */
export function applyOffset(lines: LyricLine[], offset: number): LyricLine[] {
  if (!offset) return lines;
  return lines.map((l) => ({
    ...l,
    time: Math.max(0, l.time + offset),
    words: l.words?.map((w) => ({ ...w, start: Math.max(0, w.start + offset), end: Math.max(0, w.end + offset) })),
  }));
}

/** Index of the line being sung at `t` (-1 before the first line). */
export function activeLineIndex(lines: LyricLine[], t: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= t + 0.12) active = i;
    else break;
  }
  return active;
}

/** 0..1 progress of a single word at time `t`. */
export function wordProgress(word: LyricWord, t: number): number {
  const dur = word.end - word.start;
  if (dur <= 0) return t >= word.start ? 1 : 0;
  return Math.max(0, Math.min(1, (t - word.start) / dur));
}

export function formatLyricTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
