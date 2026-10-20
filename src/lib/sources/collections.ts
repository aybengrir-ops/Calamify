import { searchYouTube } from "@/lib/innertube";
import { searchTracks } from "@/lib/audius";
import { browseByGenre } from "@/lib/sources/newgrounds";
import type { Song } from "@/lib/types";

/**
 * Curated copyright-free collections: Phonk / Phunk / Hardcore / Dreamcore,
 * Anime (OP, ED, OST, Lofi, Remixes) and Nasheeds / Arabic poetry.
 *
 * Every collection blends three real sources – Innertube (YouTube), the Audius
 * full-length backbone and Newgrounds genre browsing – so each row is playable
 * end-to-end, then de-duplicates by track id.
 */

export interface Collection {
  key: string;
  group: "phonk" | "anime" | "nasheed";
  name: string;
  nameEn?: string;
  description: string;
  icon: string;
  from: string;
  to: string;
  searchQueries: string[];
  ngGenres?: string[];
  copyright: string;
  genre: string;
}

export const COLLECTIONS: Collection[] = [
  /* ---------------- Phonk / Phunk / Hardcore / Dreamcore ---------------- */
  {
    key: "phonk", group: "phonk", name: "🏎️ Phonk Drift", description: "Aggressive drift phonk, cowbell madness and Memphis textures", icon: "🏎️", from: "#7f1d1d", to: "#111827",
    searchQueries: ["phonk drift no copyright", "aggressive phonk royalty free", "drift phonk NCS", "phonk wave copyright free", "cowbell phonk no copyright", "memphis phonk royalty free"],
    ngGenres: ["electronic-other", "electronic-experimental"], copyright: "No Copyright", genre: "Phonk",
  },
  {
    key: "phunk", group: "phonk", name: "🎸 Phunk Groove", description: "Funky phunk basslines and electro groove", icon: "🎸", from: "#f59e0b", to: "#7b2ff7",
    searchQueries: ["phunk no copyright", "phunk bass royalty free", "electro phunk NCS", "phunk groove copyright free"],
    ngGenres: ["electronic-house", "electronic-dance"], copyright: "No Copyright", genre: "Phunk",
  },
  {
    key: "hardcore", group: "phonk", name: "💀 Hardcore", description: "Hardcore techno, gabber, frenchcore and uptempo", icon: "💀", from: "#111827", to: "#7b2ff7",
    searchQueries: ["hardcore techno no copyright", "gabber royalty free", "frenchcore NCS", "hardcore electronic copyright free", "uptempo hardcore no copyright", "terrorcore royalty free"],
    ngGenres: ["electronic-hardcore", "electronic-drum-n-bass"], copyright: "No Copyright", genre: "Hardcore",
  },
  {
    key: "dreamcore", group: "phonk", name: "🌙 Dreamcore", description: "Ethereal dreamcore, weirdcore and liminal-space ambient", icon: "🌙", from: "#312e81", to: "#00d4ff",
    searchQueries: ["dreamcore music no copyright", "weirdcore ambient royalty free", "dreamcore aesthetic music", "liminal space music no copyright", "dreamy ambient NCS"],
    ngGenres: ["electronic-ambient", "electronic-experimental", "electronic-glitch"], copyright: "No Copyright", genre: "Dreamcore",
  },

  /* ------------------------------- Anime ------------------------------- */
  {
    key: "openings", group: "anime", name: "🎌 Anime Openings (OP)", description: "Full-length openings, covers and remixes", icon: "🎌", from: "#ff2e97", to: "#7b2ff7",
    searchQueries: ["anime opening no copyright", "anime OP full version royalty free", "anime opening remix no copyright", "anime OP cover copyright free", "best anime openings NCS"],
    copyright: "No Copyright", genre: "Anime",
  },
  {
    key: "endings", group: "anime", name: "🌸 Anime Endings (ED)", description: "Endings, soft covers and full versions", icon: "🌸", from: "#f472b6", to: "#38bdf8",
    searchQueries: ["anime ending no copyright", "anime ED full version royalty free", "anime ending remix copyright free", "anime ED cover no copyright"],
    copyright: "No Copyright", genre: "Anime",
  },
  {
    key: "ost", group: "anime", name: "🎻 Anime OST / Soundtrack", description: "Battle themes, emotional scores and piano OSTs", icon: "🎻", from: "#1e3a8a", to: "#a78bfa",
    searchQueries: ["anime OST no copyright", "anime soundtrack royalty free", "anime background music copyright free", "anime battle music no copyright", "anime emotional OST royalty free", "anime piano OST no copyright", "anime epic soundtrack NCS"],
    copyright: "No Copyright", genre: "Anime OST",
  },
  {
    key: "lofi_anime", group: "anime", name: "🎧 Lofi Anime Beats", description: "Chill anime lofi for studying and drifting", icon: "🎧", from: "#22c55e", to: "#00d4ff",
    searchQueries: ["lofi anime beats no copyright", "anime lofi hip hop royalty free", "anime chill lofi NCS", "anime study beats copyright free"],
    copyright: "No Copyright", genre: "Lofi Anime",
  },
  {
    key: "remixes", group: "anime", name: "🔥 Anime Remixes", description: "EDM, phonk, trap and dubstep flips of anime themes", icon: "🔥", from: "#f97316", to: "#ff2e97",
    searchQueries: ["anime remix no copyright", "anime EDM remix royalty free", "anime phonk remix", "anime trap remix no copyright", "anime dubstep remix copyright free"],
    copyright: "No Copyright", genre: "Anime Remix",
  },

  /* --------------------- Nasheeds & Arabic poetry ---------------------- */
  {
    key: "islamic_nasheed", group: "nasheed", name: "🕌 أناشيد إسلامية", nameEn: "Islamic Nasheeds", description: "Vocals-only nasheeds and copyright-free religious songs", icon: "🕌", from: "#065f46", to: "#ffd700",
    searchQueries: ["أناشيد إسلامية بدون حقوق", "islamic nasheed no copyright", "nasheed royalty free", "أناشيد دينية بدون موسيقى", "islamic nasheed vocals only", "nasheed no music copyright free"],
    copyright: "No Copyright", genre: "Nasheed",
  },
  {
    key: "anashid_children", group: "nasheed", name: "👶 أناشيد أطفال", nameEn: "Children Nasheeds", description: "Gentle nasheeds for kids", icon: "👶", from: "#0ea5e9", to: "#facc15",
    searchQueries: ["أناشيد أطفال إسلامية", "islamic kids nasheed no copyright", "أناشيد أطفال بدون حقوق"],
    copyright: "No Copyright", genre: "Nasheed",
  },
  {
    key: "madih", group: "nasheed", name: "💚 مديح نبوي", nameEn: "Prophetic Praise (Madih)", description: "Praise poetry and madih nabawi", icon: "💚", from: "#065f46", to: "#22c55e",
    searchQueries: ["مديح نبوي بدون حقوق", "madih nabawi no copyright", "أناشيد في مدح الرسول", "prophet praise nasheed royalty free"],
    copyright: "No Copyright", genre: "Madih",
  },
  {
    key: "dua", group: "nasheed", name: "🤲 أدعية و أذكار", nameEn: "Duas & Adhkar", description: "Morning and evening adhkar, beautiful duʿāʾ recitation", icon: "🤲", from: "#0d9488", to: "#a7f3d0",
    searchQueries: ["أدعية بصوت جميل بدون حقوق", "dua audio no copyright", "أذكار الصباح والمساء", "morning evening adhkar audio"],
    copyright: "No Copyright", genre: "Dua",
  },
  {
    key: "shi3r_arabi", group: "nasheed", name: "📜 شعر عربي", nameEn: "Arabic Poetry", description: "Spoken and recited Arabic poetry", icon: "📜", from: "#b45309", to: "#ffd700",
    searchQueries: ["شعر عربي مسموع بدون حقوق", "arabic poetry audio no copyright", "قصائد عربية بصوت جميل", "arabic poem recitation royalty free"],
    copyright: "No Copyright", genre: "Poetry",
  },
  {
    key: "shi3r_nabati", group: "nasheed", name: "🏜️ شعر نبطي", nameEn: "Nabati Poetry", description: "Bedouin Nabati qasidas", icon: "🏜️", from: "#d97706", to: "#78350f",
    searchQueries: ["شعر نبطي مسموع", "nabati poetry audio", "قصائد نبطية بدون حقوق"],
    copyright: "No Copyright", genre: "Poetry",
  },
  {
    key: "shi3r_fusha", group: "nasheed", name: "📖 شعر فصحى", nameEn: "Classical Arabic Poetry", description: "Fusḥā recitations from the classical canon", icon: "📖", from: "#7c2d12", to: "#fbbf24",
    searchQueries: ["شعر فصحى مسموع بدون حقوق", "classical arabic poetry recitation", "قصائد فصحى بصوت جميل"],
    copyright: "No Copyright", genre: "Poetry",
  },
  {
    key: "qasaid", group: "nasheed", name: "🎶 قصائد مغناة", nameEn: "Sung Qasidas", description: "Sung qasidas and Andalusian pieces", icon: "🎶", from: "#9d174d", to: "#fbbf24",
    searchQueries: ["قصائد مغناة بدون حقوق", "sung qasida no copyright", "قصائد أندلسية مسموعة"],
    copyright: "No Copyright", genre: "Qasida",
  },
  {
    key: "sufi", group: "nasheed", name: "🌀 إنشاد صوفي", nameEn: "Sufi Chants", description: "Sufi dhikr, inshad and Mevlevi sema", icon: "🌀", from: "#0f766e", to: "#a78bfa",
    searchQueries: ["إنشاد صوفي بدون حقوق", "sufi nasheed no copyright", "sufi dhikr audio royalty free", "مولوية سماع بدون حقوق"],
    copyright: "No Copyright", genre: "Sufi",
  },
];

export const COLLECTION_GROUPS = [
  { key: "phonk", name: "Phonk · Phunk · Hardcore · Dreamcore", icon: "🏎️" },
  { key: "anime", name: "Anime OP · ED · OST · Lofi · Remixes", icon: "🎌" },
  { key: "nasheed", name: "أناشيد إسلامية و أشعار", icon: "🕌" },
] as const;

const cache = new Map<string, { at: number; songs: Song[] }>();
const TTL = 10 * 60 * 1000;

export function getCollection(key: string) {
  return COLLECTIONS.find((c) => c.key === key) || null;
}

export function listCollections() {
  return COLLECTION_GROUPS.map((group) => ({
    ...group,
    collections: COLLECTIONS.filter((c) => c.group === group.key).map((c) => ({
      key: c.key,
      name: c.name,
      nameEn: c.nameEn,
      description: c.description,
      icon: c.icon,
      from: c.from,
      to: c.to,
      copyright: c.copyright,
      genre: c.genre,
    })),
  }));
}

/** Resolve a collection into a playable, de-duplicated track list. */
export async function getCollectionTracks(key: string, limit = 30): Promise<Song[]> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.songs.slice(0, limit);

  const collection = getCollection(key);
  if (!collection) return [];

  const perQuery = Math.max(6, Math.ceil(limit / 3));
  const [ytBatches, audius, ngTracks] = await Promise.all([
    Promise.all(collection.searchQueries.slice(0, 3).map((q) => searchYouTube(q, perQuery).catch(() => [] as Song[]))),
    searchTracks(collection.searchQueries[0], Math.ceil(limit / 3)).catch(() => [] as Song[]),
    collection.ngGenres?.length
      ? browseByGenre(collection.ngGenres[0], { sort: "score" }).then((r) => r.tracks.slice(0, 8)).catch(() => [] as Song[])
      : Promise.resolve([] as Song[]),
  ]);

  const seen = new Set<string>();
  const out: Song[] = [];
  const push = (song: Song) => {
    if (!song?.id || seen.has(song.id)) return;
    seen.add(song.id);
    out.push({
      ...song,
      genre: song.genre || collection.genre,
      copyright: song.copyright || collection.copyright,
      album: song.album || collection.name,
      provider: song.provider || (song.source === "audius" ? "audius" : "youtube"),
    });
  };

  // guaranteed full-length streams first, then the deep Innertube catalogue
  audius.forEach(push);
  ngTracks.forEach(push);
  ytBatches.flat().forEach(push);

  cache.set(key, { at: Date.now(), songs: out });
  return out.slice(0, limit);
}
