import type { Song } from "@/lib/types";

/**
 * القرآن الكريم — powered by the free, official Al-Quran Cloud API
 * (api.alquran.cloud) for text/metadata and the islamic.network CDN for
 * full-surah audio. Verified: HTTP Range works (206 + mid-file seeks), so
 * playback is seekable and complete — never a preview.
 */

const QURAN_API = "https://api.alquran.cloud/v1";
const AUDIO_CDN = "https://cdn.islamic.network/quran";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan" | string;
}

export interface Reciter {
  id: string;
  name: string;
  nameEn: string;
  englishName?: string;
  country?: string;
  bitrate?: number;
}

/** Reciters we surface first (the rest of the 176 come from the API). */
export const FEATURED_RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري راشد العفاسي", nameEn: "Mishary Rashid Alafasy", country: "🇰🇼" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتل)", nameEn: "Abdul Basit (Murattal)", country: "🇪🇬" },
  { id: "ar.abdulbasitmujawwad", name: "عبد الباسط عبد الصمد (مجود)", nameEn: "Abdul Basit (Mujawwad)", country: "🇪🇬" },
  { id: "ar.husary", name: "محمود خليل الحصري", nameEn: "Mahmoud Khalil Al-Husary", country: "🇪🇬" },
  { id: "ar.husarymujawwad", name: "محمود خليل الحصري (مجود)", nameEn: "Al-Husary (Mujawwad)", country: "🇪🇬" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي (مرتل)", nameEn: "Al-Minshawi (Murattal)", country: "🇪🇬" },
  { id: "ar.minshawimujawwad", name: "محمد صديق المنشاوي (مجود)", nameEn: "Al-Minshawi (Mujawwad)", country: "🇪🇬" },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", nameEn: "Abu Bakr Al-Shatri", country: "🇸🇦" },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", nameEn: "Ahmed ibn Ali Al-Ajamy", country: "🇸🇦" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", nameEn: "Maher Al-Muaiqly", country: "🇸🇦" },
  { id: "ar.saaboralmueaqly", name: "سعود الشريم", nameEn: "Saud Al-Shuraim", country: "🇸🇦" },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", nameEn: "Abdurrahmaan As-Sudais", country: "🇸🇦" },
  { id: "ar.hanaboralmueaqly", name: "هاني الرفاعي", nameEn: "Hani Ar-Rifai", country: "🇸🇦" },
  { id: "ar.juhany", name: "عبد الله الجهني", nameEn: "Abdullah Al-Juhany", country: "🇸🇦" },
  { id: "ar.yasser", name: "ياسر الدوسري", nameEn: "Yasser Al-Dosari", country: "🇸🇦" },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", nameEn: "Muhammad Ayyub", country: "🇸🇦" },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", nameEn: "Muhammad Jibreel", country: "🇪🇬" },
  { id: "ar.tablaway", name: "محمد الطبلاوي", nameEn: "Mohammad Al-Tablaway", country: "🇪🇬" },
  { id: "ar.parhizgar", name: "شهریار پرهیزگار", nameEn: "Shahriar Parhizgar", country: "🇮🇷" },
  { id: "ar.ibrahim", name: "إبراهيم الأخضر", nameEn: "Ibrahim Al-Akhdar", country: "🇸🇦" },
];

export const DEFAULT_RECITER = "ar.alafasy";

/* ----------------------------- URLs ----------------------------- */
/** Full-surah audio (seekable MP3). */
export function getQuranAudioUrl(reciterId: string, surahNumber: number, bitrate = 128): string {
  return `${AUDIO_CDN}/audio-surah/${bitrate}/${reciterId}/${surahNumber}.mp3`;
}

/** Single ayah audio (`{surah:3}{ayah:3}` → 001001.mp3). */
export function getVerseAudioUrl(reciterId: string, surahNumber: number, verseNumber: number, bitrate = 128): string {
  const s = String(surahNumber).padStart(3, "0");
  const v = String(verseNumber).padStart(3, "0");
  return `${AUDIO_CDN}/audio/${bitrate}/${reciterId}/${s}${v}.mp3`;
}

/* --------------------------- caching ---------------------------- */
const g = globalThis as unknown as {
  __quranSurahs?: { at: number; data: Surah[] };
  __quranReciters?: { at: number; data: Reciter[] };
  __quranText?: Map<string, { at: number; verses: Ayah[]; meta: Surah | null }>;
};

async function j(url: string, timeout = 15000): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "Calamify/1.0" } });
  if (!r.ok) throw new Error(`alquran.cloud ${r.status}`);
  return r.json();
}

/** All 114 surahs (live from the API, cached 24h). */
export async function getSurahs(): Promise<Surah[]> {
  const cached = g.__quranSurahs;
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.data;
  try {
    const data = await j(`${QURAN_API}/surah`);
    const list: Surah[] = (data?.data || []).map((s: any) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));
    if (list.length) {
      g.__quranSurahs = { at: Date.now(), data: list };
      return list;
    }
  } catch {
    /* fall through to the offline sample */
  }
  return FALLBACK_SURAHS;
}

/** Every audio reciter the API exposes (176+), featured ones first. */
export async function getReciters(): Promise<Reciter[]> {
  const cached = g.__quranReciters;
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.data;
  let extra: Reciter[] = [];
  try {
    const data = await j(`${QURAN_API}/edition?format=audio&language=ar`);
    extra = (data?.data || [])
      .map((e: any) => ({ id: e.identifier, name: e.name, nameEn: e.englishName, englishName: e.englishName }))
      .filter((r: Reciter) => !FEATURED_RECITERS.some((f) => f.id === r.id));
  } catch {
    /* featured list only */
  }
  const list = [...FEATURED_RECITERS, ...extra];
  g.__quranReciters = { at: Date.now(), data: list };
  return list;
}

export interface Ayah {
  number: number;
  text: string;
  juz: number;
  page: number;
  sajda?: boolean;
}

/** Arabic text of one surah (Uthmani script from the API). */
export async function getSurahText(surahNumber: number): Promise<{ verses: Ayah[]; meta: Surah | null }> {
  const store = (g.__quranText ||= new Map());
  const key = String(surahNumber);
  const cached = store.get(key);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return { verses: cached.verses, meta: cached.meta };
  try {
    const data = await j(`${QURAN_API}/surah/${surahNumber}`);
    const verses: Ayah[] = (data?.data?.ayahs || []).map((a: any) => ({
      number: a.numberInSurah,
      text: a.text,
      juz: a.juz,
      page: a.page,
      sajda: Boolean(a.sajda),
    }));
    const surahs = await getSurahs();
    const meta = surahs.find((s) => s.number === surahNumber) || null;
    store.set(key, { at: Date.now(), verses, meta });
    return { verses, meta };
  } catch {
    return { verses: [], meta: null };
  }
}


/* --------------------- Arabic-aware surah matching --------------------- */
/** Strip tashkeel/Quranic marks and unify letter variants so الكهف == ٱلۡكَهۡفِ */
export function normalizeArabic(value: string): string {
  return value
    .replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u0610-\u061A]/g, "")
    .replace(/[\u0671\u0623\u0625\u0622]/g, "\u0627") // ٱ أ إ آ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0624/g, "\u0648") // ؤ → و
    .replace(/\u0626/g, "\u064A") // ئ → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/(سورة|سوره|surah|sura|al-|el-)/gi, " ")
    .replace(/[\s\-_'".]/g, "")
    .toLowerCase();
}

/** Find surahs by number, Arabic name (diacritic-insensitive) or transliteration. */
export function findSurahs(surahs: Surah[], query: string, limit = 10): Surah[] {
  const raw = (query || "").trim();
  if (!raw) return [];
  const nq = normalizeArabic(raw);
  const out: Surah[] = [];
  const seen = new Set<number>();
  const add = (s: Surah) => {
    if (!seen.has(s.number) && out.length < limit) {
      seen.add(s.number);
      out.push(s);
    }
  };

  // 1) explicit surah numbers in the query ("18", "surah 55", "سورة 67")
  const digits = (raw.match(/\d{1,3}/g) || []).map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= 114);
  for (const d of digits) {
    const hit = surahs.find((s) => s.number === d);
    if (hit) add(hit);
  }

  // 2) name matches (Arabic, transliteration, English translation)
  if (nq.length >= 2) {
    for (const s of surahs) {
      const candidates = [normalizeArabic(s.name), normalizeArabic(s.englishName), normalizeArabic(s.englishNameTranslation)];
      if (candidates.some((c) => c && c.length >= 2 && (c.includes(nq) || (nq.length >= 3 && nq.includes(c))))) add(s);
    }
  }
  return out;
}

/* ------------------------ Song integration ------------------------ */
/** Turn a surah + reciter into a Calamify Song so it joins queues, likes, playlists and history. */
export function surahToSong(surah: Surah, reciter: Reciter): Song {
  return {
    id: `qr:${reciter.id}:${surah.number}`,
    title: `${surah.number}. ${surah.englishName} — ${surah.name}`,
    artist: reciter.nameEn || reciter.name,
    duration: 0,
    thumbnail: "",
    source: "quran",
    provider: "ng",
    genre: "Quran",
    album: `القرآن الكريم · ${reciter.nameEn || reciter.name}`,
    copyright: "FREE — Al-Quran Cloud / islamic.network",
    views: `${surah.numberOfAyahs} ayahs · ${surah.revelationType}`,
  };
}

export async function getSurahSongs(reciterId = DEFAULT_RECITER, limit = 114): Promise<Song[]> {
  const [surahs, reciters] = await Promise.all([getSurahs(), getReciters()]);
  const reciter = reciters.find((r) => r.id === reciterId) || FEATURED_RECITERS[0];
  return surahs.slice(0, limit).map((s) => surahToSong(s, reciter));
}

/** Offline safety net: a handful of well-known surahs if the API is unreachable. */
const FALLBACK_SURAHS: Surah[] = [
  { number: 1, name: "سُورَةُ ٱلْفَاتِحَةِ", englishName: "Al-Faatiha", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
  { number: 2, name: "سُورَةُ البَقَرَةِ", englishName: "Al-Baqara", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
  { number: 18, name: "سُورَةُ الكَهْفِ", englishName: "Al-Kahf", englishNameTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan" },
  { number: 36, name: "سُورَةُ يَسٓ", englishName: "Ya-Sin", englishNameTranslation: "Ya Sin", numberOfAyahs: 83, revelationType: "Meccan" },
  { number: 55, name: "سُورَةُ الرَّحْمَٰنِ", englishName: "Ar-Rahman", englishNameTranslation: "The Most Gracious", numberOfAyahs: 78, revelationType: "Medinan" },
  { number: 56, name: "سُورَةُ الوَاقِعَةِ", englishName: "Al-Waakia", englishNameTranslation: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan" },
  { number: 67, name: "سُورَةُ المُلْكِ", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 112, name: "سُورَةُ الإِخْلَاصِ", englishName: "Al-Ikhlaas", englishNameTranslation: "Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
  { number: 113, name: "سُورَةُ الفَلَقِ", englishName: "Al-Falaq", englishNameTranslation: "The Dawn", numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 114, name: "سُورَةُ النَّاسِ", englishName: "An-Naas", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" },
];
