import { searchYouTube, getVideoMeta } from "@/lib/innertube";
import { getAllTracks } from "@/lib/catalogData";
import { searchTracks } from "@/lib/audius";
import { getEntry, getSection, type CatalogEntry, type CatalogSection } from "@/lib/catalogData";
import type { Song } from "@/lib/types";
import { dedupeCanonical, dedupeEntries } from "@/lib/dedupe";

/**
 * Resolves curated catalogue entries (NCS classics, NEFFEX, Kevin MacLeod,
 * Geometry Dash, Phonk, Anime Lofi, TheFatRat, Alan Walker & Marshmello,
 * Undertale, The Living Tombstone) into real, playable, full-length Calamify
 * songs. Resolutions are cached so repeat plays are instant.
 *
 * Candidate ranking is deliberately strict: gameplay/verification/showcase
 * uploads, nightcore/ringtone edits and compilation dumps score badly, while
 * official artist channels ("… - Topic") and title+artist matches score well.
 */

const g = globalThis as unknown as { __catalogResolved?: Map<string, { at: number; song: Song | null }> };
const resolved = (g.__catalogResolved ||= new Map());
const inflight = new Map<string, Promise<Song | null>>();
const TTL = 6 * 60 * 60 * 1000;
/** Failures (cold start, transient upstream error) must self-heal quickly. */
const MISS_TTL = 45 * 1000;

function norm(v: string) {
  return (v || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Uploads that contain the song but are NOT the song. */
const BAD_CONTENT =
  /(verification|verified|gameplay|playthrough|walkthrough|speedrun|showcase|all coins|no coins|100 ?%|full level|level play|practice mode|demon list|pointercrate|extreme demon|hard demon|insane demon|easy demon|ringtone|whatsapp status|nightcore|sped up|slowed|reverb|karaoke|8 ?bit cover|reaction|tutorial|how to|greatest hits|top \d+|dj mix|full set|live at|\blive\b|medley|concert|animatic|parody|cover by|fanmade|remake|unleashed|solo built|acoustic|unplugged|fingerstyle|guitar cover|piano cover|restrung|truth of|the story of|explained|every difficulty|lyric translation|sight-read|sight read|sheet music|trailer|tutorial|sound effect|\bcover\b)/i;
/** Official artist uploads on YouTube carry the "- Topic" channel suffix. */
const TOPIC_CHANNEL = /- topic$/i;

function titleTokens(value: string) {
  const stop = new Set(["the", "and", "for", "with", "feat", "ft", "official", "music", "video", "audio", "of", "a", "an", "in", "on", "to", "my", "your", "ncs", "ost", "song"]);
  return norm(value).split(" ").filter((w) => w.length > 2 && !stop.has(w));
}

/** Word-boundary token match – avoids "krypTOBUm" passing as "Tobu". */
function hasWord(haystack: string, word: string): boolean {
  if (!word) return false;
  return new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(haystack);
}

/**
 * Sequel / part markers: "Theory of Everything" vs "…2", "Alone" vs "Alone, Pt. II".
 * Two entries whose markers differ are different songs and must never swap.
 */
const SEQUEL_RE = /(\bpt\.?\s*(i{1,3}|iv|v|1|2|3|4|5)\b|\bpart\s*\d+\b|\b(ii|iii|iv|2|3|4)\b)/gi;
function sequelMarkers(title: string): string {
  const found = (title || "").toLowerCase().match(SEQUEL_RE);
  return found ? [...new Set(found.map((f) => f.replace(/[^a-z0-9]/g, "")))].sort().join("+") : "";
}

/** Channel names arrive concatenated ("ImagineDragonsVEVO") – compare the squashed forms. */
const CHANNEL_NOISE = /(vevo|official|music|records|lyrics|topic|hd|tv)$/;
function squash(value: string): string {
  return norm(value).replace(/\s+/g, "").replace(CHANNEL_NOISE, "");
}

/** How strongly a candidate matches the curated entry (higher = better). */
export function scoreCandidate(candidate: Song, entry: CatalogEntry, aliases: string[] = []): number {
  const wantTitle = titleTokens(entry.title);
  const gotTitle = norm(candidate.title);
  const gotArtist = norm(candidate.artist);
  const wantArtistRaw = entry.artist.split(/ feat\.| & |×| x /i)[0];
  const wantArtist = norm(wantArtistRaw).split(" ").filter((w) => w.length > 2);

  let score = 0;

  // title fidelity – titles made only of short words ("On & On") are matched whole
  if (wantTitle.length) {
    // word-boundary matching: the entry "Fade" must NOT match "Faded"
    const matched = wantTitle.filter((w) => hasWord(gotTitle, w)).length;
    const ratio = matched / wantTitle.length;
    score += Math.round(ratio * 6);
    if (ratio === 1 && wantTitle.length > 1) score += 2;
    // "Last Hope" must not be satisfied by "Hopes and Dreams"
    if (ratio > 0 && ratio < 1 && wantTitle.length >= 2) score -= 6;
    if (ratio === 0) score -= 6;
  } else {
    const whole = norm(entry.title);
    score += whole && gotTitle.includes(whole) ? 8 : -4;
  }

  // artist fidelity – one-word titles ("Life", "Hope", "Cold") must also match the artist,
  // otherwise any unrelated track containing that word wins
  const wantSquash = squash(wantArtistRaw);
  const gotSquash = squash(candidate.artist);
  const wordMatch = wantArtist.length > 0 && wantArtist.some((w) => hasWord(gotArtist, w));
  const squashMatch = wantSquash.length > 2 && gotSquash.startsWith(wantSquash);
  const looseMatch = gotArtist.split(" ").filter((w) => w.length > 2).some((w) => hasWord(norm(entry.artist), w));
  // sections whose uploads may be credited to a label/fan channel ("Undertale OST: …")
  const aliasMatch = aliases.some((a) => {
    const w = norm(a);
    return w.length > 2 && (hasWord(gotArtist, w) || norm(candidate.title).includes(w) || hasWord(norm(candidate.title), w));
  });
  const artistMatched = wordMatch || squashMatch || looseMatch || aliasMatch;

  if (wordMatch || squashMatch) score += 4;
  else if (aliasMatch || looseMatch) score += 3;
  else score -= 3;

  // a cover/remix/alternate take is a different recording than the curated entry
  const wantsVariant = /remix|live|version|edit/i.test(entry.title);
  if (!wantsVariant && /\bremix\b|\bversion\b|\bedit\b/i.test(candidate.title)) score -= 3;

  // "Theory of Everything" must never resolve to "Theory of Everything 2"
  if (sequelMarkers(entry.title) !== sequelMarkers(candidate.title)) score -= 6;

  // Tie-breaker: a title carrying many unrelated words is a different song.
  // "Alan Walker - Alone" (0 extras) beats "Better Off (Alone, Pt. III)" (3 extras).
  {
    const entryWords = new Set([...wantTitle, ...norm(entry.artist).split(" ").filter((w) => w.length > 2)]);
    const extras = gotTitle.split(" ").filter((w) => w.length > 2 && !entryWords.has(w)).length;
    if (extras >= 3) score -= Math.min(2, extras - 2);
  }

  // official artist channel uploads are the real thing
  if (TOPIC_CHANNEL.test(candidate.artist)) score += 3;
  if (/official|audio|visualizer|lyric/i.test(candidate.title)) score += 1;

  // guaranteed full-length source
  if (candidate.source === "audius") score += 2;

  // wrong-kind-of-upload penalties
  if (BAD_CONTENT.test(candidate.title)) score -= 7;
  if (/ringtone|whatsapp status/i.test(candidate.title)) score -= 8;
  if (candidate.duration && candidate.duration < 60) score -= 4; // clips, ringtones, stingers
  if (candidate.duration && candidate.duration >= 120) score += 1; // complete uploads
  if (candidate.duration && candidate.duration > 2400) score -= 6; // hour-long mixes, not tracks

  return score;
}

/** `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` → the real video id. */
function coverVideoId(cover: string): string | null {
  const m = /i\.ytimg\.com\/vi\/([A-Za-z0-9_-]{6,})/.exec(cover || "");
  return m ? m[1] : null;
}

/** Cover ids used by exactly one entry are trustworthy pointers to the real upload. */
function uniqueCoverIds(): Set<string> {
  const counts = new Map<string, number>();
  for (const e of getAllTracks()) {
    const id = coverVideoId(e.cover);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n === 1).map(([id]) => id));
}

function decorate(song: Song, entry: CatalogEntry, section: CatalogSection): Song {
  return {
    ...song,
    title: song.title || entry.title,
    artist: song.artist || entry.artist,
    thumbnail: song.thumbnail || entry.cover,
    genre: song.genre || entry.genre,
    album: section.title,
    copyright: section.copyright,
    provider: song.provider || (song.source === "audius" ? "audius" : "youtube"),
    views: song.views || `${entry.year}`,
  };
}

/** Resolve one curated entry to a playable Song (cached). */
export async function resolveCatalogEntry(entryId: string, exclude?: Set<string>): Promise<Song | null> {
  const found = getEntry(entryId);
  if (!found) return null;
  const { entry, section } = found;

  const cached = resolved.get(entryId);
  if (!exclude?.size && cached && Date.now() - cached.at < (cached.song ? TTL : MISS_TTL)) return cached.song;
  if (exclude?.size && cached && cached.song && !exclude.has(cached.song.id) && Date.now() - cached.at < TTL) return cached.song;
  const pending = inflight.get(entryId);
  if (pending) return pending;

  const task = (async () => {
    try {
      // Fast path: artwork that belongs to exactly one entry IS the real upload.
      const vid = coverVideoId(entry.cover);
      if (vid && uniqueCoverIds().has(vid)) {
        const meta = await getVideoMeta(vid).catch(() => null);
        // getVideoMeta can return "Unknown title"/"Unknown Artist" when the
        // upload is unavailable – never hand that to the player.
        const placeholder =
          !meta || /^(unknown|untitled)\b/i.test(meta.title) || /^(unknown artist|various artists)$/i.test(meta.artist) || !meta.duration;
        const plausible =
          !placeholder &&
          (titleTokens(entry.title).some((w) => hasWord(norm(meta.title), w)) ||
            norm(entry.artist)
              .split(" ")
              .filter((w) => w.length > 3)
              .some((w) => hasWord(norm(meta.artist), w)));
        if (plausible) {
          const song = decorate(meta as Song, entry, section);
          resolved.set(entryId, { at: Date.now(), song });
          return song;
        }
      }

      const queries = [entry.ytQuery, `${entry.artist.split(/ feat\.| & /)[0]} ${entry.title}`].filter((q, i, arr) => q && arr.indexOf(q) === i);
      const [audius, ...ytBatches] = await Promise.all([
        searchTracks(queries[queries.length - 1] || entry.title, 6).catch(() => [] as Song[]),
        ...queries.map((q) => searchYouTube(q, 10).catch(() => [] as Song[])),
      ]);
      const seen = new Set<string>();
      const pool = [...audius, ...ytBatches.flat()].filter((s) => s?.id && !seen.has(s.id) && seen.add(s.id));
      const aliases = section.artistAliases || [];
      const ranked = pool
        .map((song) => ({ song, score: scoreCandidate(song, entry, aliases) }))
        .sort((a, b) => b.score - a.score);

      // Prefer a confident match, then a decent one, then anything that is
      // plausibly audio – a playable near-miss beats a permanently dead row.
      // The last two tiers must still belong to the right artist – otherwise a
      // track that merely shares a word ("Hero Killer" for Skillet's "Hero") wins.
      const wantTitle = titleTokens(entry.title);
      const strict = Boolean(section.strictArtist);
      const cleanFullTitle = (song: Song) => {
        const got = norm(song.title);
        return (
          wantTitle.length > 0 &&
          wantTitle.every((w) => got.includes(w)) &&
          !BAD_CONTENT.test(song.title) &&
          (song.duration || 0) >= 45
        );
      };
      const artistOf = (song: Song) => {
        const want = squash(entry.artist.split(/ feat\.| & /)[0]);
        if (aliases.some((a) => norm(song.title).includes(norm(a)) || norm(song.artist).includes(norm(a)))) return true;
        const got = squash(song.artist);
        // collabs often credit the artist in the title: "… (ft. The Living Tombstone)"
        const titleHasArtist =
          want.length > 2 && norm(song.title).replace(/\s+/g, "").includes(want);
        return titleHasArtist ||
          (want.length > 2 && (got.startsWith(want) || want.startsWith(got))) ||
          entry.artist.toLowerCase().split(/\s+/).filter((w) => w.length > 2).some((w) => norm(song.artist).includes(w)) ||
          norm(song.artist).split(/\s+/).filter((w) => w.length > 2).some((w) => norm(entry.artist).includes(w));
      };
      const acceptable = (song: Song) => (strict ? artistOf(song) : artistOf(song) || cleanFullTitle(song));
      // never hand the same upload to two entries of the same shelf
      const free = exclude?.size ? ranked.filter((r) => !exclude.has(r.song.id)) : ranked;
      const pickFrom = free.length ? free : ranked;
      // A candidate must really carry the entry's title: all meaningful words
      // for short titles, or all but one for longer ones. This is what stops
      // "Ouroboros" resolving to "Freedom19 Preview" or "Hero" to "Hero Killer".
      const titleReallyMatches = (song: Song) => {
        const got = norm(song.title);
        const hit = wantTitle.filter((w) => hasWord(got, w)).length;
        return wantTitle.length <= 2 ? hit === wantTitle.length : hit >= Math.max(2, wantTitle.length - 1);
      };
      // Rank title-matching candidates first, but never leave a row dead:
      // the last tier is the previous behaviour (artist-matched audio, ≥30 s),
      // so every card still plays something real instead of showing "resolving".
      const best =
        pickFrom.find((r) => r.score >= 5 && acceptable(r.song) && titleReallyMatches(r.song)) ||
        pickFrom.find((r) => r.score >= 2 && acceptable(r.song) && titleReallyMatches(r.song)) ||
        pickFrom.find((r) => r.score >= -4 && acceptable(r.song) && (r.song.duration || 0) >= 60);
      const song = best ? decorate(best.song, entry, section) : null;
      resolved.set(entryId, { at: Date.now(), song });
      return song;
    } catch {
      resolved.set(entryId, { at: Date.now(), song: null });
      return null;
    } finally {
      inflight.delete(entryId);
    }
  })();

  inflight.set(entryId, task);
  return task;
}

/** Resolve a whole section with bounded concurrency. */
export async function resolveSection(sectionId: string, limit = 80, concurrency = 6): Promise<Song[]> {
  const section = getSection(sectionId);
  if (!section) return [];
  const entries = dedupeEntries(section.entries).kept.slice(0, limit);
  const out: Song[] = [];
  const used = new Set<string>();
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const settled = await Promise.all(batch.map((e) => resolveCatalogEntry(e.id, used).catch(() => null)));
    for (const song of settled) {
      if (!song || used.has(song.id)) continue; // second line of defence against repeats
      used.add(song.id);
      out.push(song);
    }
  }
  // final canonical pass: same source+id, or same artist+title+duration(±2s)
  return dedupeCanonical(out).kept;
}

/** Local catalogue matches, resolved (used by universal search). */
export async function resolveLocalMatches(entries: CatalogEntry[]): Promise<Song[]> {
  const settled = await Promise.all(entries.map((e) => resolveCatalogEntry(e.id).catch(() => null)));
  return settled.filter(Boolean) as Song[];
}
