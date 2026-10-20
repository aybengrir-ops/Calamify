/**
 * Calamify curated catalogue — hand-picked, copyright-free / royalty-free
 * tracks. Static metadata (title, artist, year, artwork, search query) so the
 * UI paints instantly; the server resolves each entry to a real, playable,
 * full-length stream on demand (`src/lib/sources/catalog.ts`).
 */

export interface CatalogEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  ytQuery: string;
  cover: string;
}

export interface CatalogSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  copyright: string;
  /** when true, a candidate must belong to this artist (no fan/cover uploads) */
  strictArtist?: boolean;
  /** extra names that legitimately appear in an upload's title/channel */
  artistAliases?: string[];
  /** optional labelled sub-groups (e.g. the Geometry Dash OST) */
  subGroups?: { label: string; entryIds: string[] }[];
  entries: CatalogEntry[];
}

/** Accept both the canonical ids and the short aliases used elsewhere. */
const SECTION_ALIASES: Record<string, string> = {
  thefatrat: "thefatrat",
  ncs: "ncs-famous",
  "ncs-famous": "ncs-famous",
  gd: "geometry-dash",
  "aw-mm": "aw-mm",
  "alan-walker": "aw-mm",
  marshmello: "aw-mm",
  undertale: "undertale",
  "toby-fox": "undertale",
  tlt: "living-tombstone",
  "living-tombstone": "living-tombstone",
  fob: "fall-out-boy",
  "fall-out-boy": "fall-out-boy",
  "imagine-dragons": "imagine-dragons",
  skillet: "skillet",
  "geometry-dash": "geometry-dash",
  anime: "anime-lofi",
  "anime-lofi": "anime-lofi",
  kevin: "kevin-macleod",
  "kevin-macleod": "kevin-macleod",
  neffex: "neffex",
  phonk: "phonk",
};

const yt = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

/* ─────────────── TheFatRat — full collection ─────────────── */
export const theFatRatTracks: CatalogEntry[] = [
  { id: "tfr-unity", title: "Unity", artist: "TheFatRat", genre: "Electronic", year: 2014, ytQuery: "TheFatRat Unity", cover: yt("n8X9_MgEdCg") },
  { id: "tfr-monody", title: "Monody", artist: "TheFatRat feat. Laura Brehm", genre: "Electronic", year: 2015, ytQuery: "TheFatRat Monody Laura Brehm", cover: yt("B7xai5u_tnk") },
  { id: "tfr-windfall", title: "Windfall", artist: "TheFatRat", genre: "Electronic", year: 2014, ytQuery: "TheFatRat Windfall", cover: yt("Y6cy3g8XCBs") },
  { id: "tfr-flyaway", title: "Fly Away", artist: "TheFatRat feat. Anjulie", genre: "Pop Electronic", year: 2017, ytQuery: "TheFatRat Fly Away Anjulie", cover: yt("c9MvG2XRi9I") },
  { id: "tfr-timelapse", title: "Time Lapse", artist: "TheFatRat", genre: "Electronic", year: 2015, ytQuery: "TheFatRat Time Lapse", cover: yt("3fxq7k3TWO8") },
  { id: "tfr-xenogenesis", title: "Xenogenesis", artist: "TheFatRat", genre: "Electronic", year: 2014, ytQuery: "TheFatRat Xenogenesis", cover: yt("2A1IbJl0M4I") },
  { id: "tfr-jackpot", title: "Jackpot", artist: "TheFatRat", genre: "Electronic", year: 2016, ytQuery: "TheFatRat Jackpot", cover: yt("GjLhJHqXbVU") },
  { id: "tfr-calling", title: "The Calling", artist: "TheFatRat feat. Laura Brehm", genre: "Electronic", year: 2016, ytQuery: "TheFatRat The Calling Laura Brehm", cover: yt("K9SHpAQt8wI") },
  { id: "tfr-neveralone", title: "Never Be Alone", artist: "TheFatRat", genre: "Electronic", year: 2019, ytQuery: "TheFatRat Never Be Alone", cover: yt("lG5HVgXppPU") },
  { id: "tfr-prelude", title: "Prelude", artist: "TheFatRat", genre: "Electronic", year: 2016, ytQuery: "TheFatRat Prelude", cover: yt("dI2K0JiHqMo") },
  { id: "tfr-epic", title: "Epic", artist: "TheFatRat", genre: "Electronic", year: 2016, ytQuery: "TheFatRat Epic", cover: yt("dI2K0JiHqMo") },
  { id: "tfr-origin", title: "Origin", artist: "TheFatRat", genre: "Electronic", year: 2019, ytQuery: "TheFatRat Origin", cover: yt("U47d9wPnqJc") },
  { id: "tfr-solitude", title: "Solitude", artist: "TheFatRat", genre: "Electronic", year: 2019, ytQuery: "TheFatRat Solitude", cover: yt("lG5HVgXppPU") },
  { id: "tfr-elegy", title: "Elegy", artist: "TheFatRat", genre: "Electronic", year: 2020, ytQuery: "TheFatRat Elegy", cover: yt("U47d9wPnqJc") },
  { id: "tfr-mayday", title: "Mayday", artist: "TheFatRat feat. Laura Brehm", genre: "Electronic", year: 2018, ytQuery: "TheFatRat Mayday Laura Brehm", cover: yt("VjJmYhCnXaI") },
  { id: "tfr-riseup", title: "Rise Up", artist: "TheFatRat", genre: "Electronic", year: 2018, ytQuery: "TheFatRat Rise Up", cover: yt("U7RcJ-7h1P0") },
  { id: "tfr-closetothesun", title: "Close To The Sun", artist: "TheFatRat feat. Anjulie", genre: "Pop Electronic", year: 2019, ytQuery: "TheFatRat Close To The Sun Anjulie", cover: yt("f0W7e8kQJhI") },
  { id: "tfr-oblivion", title: "Oblivion", artist: "TheFatRat feat. Lola Blanc", genre: "Pop Electronic", year: 2017, ytQuery: "TheFatRat Oblivion Lola Blanc", cover: yt("qFbLz0b3x9E") },
  { id: "tfr-wellmeetagain", title: "We\'ll Meet Again", artist: "TheFatRat feat. Laura Brehm", genre: "Electronic", year: 2020, ytQuery: "TheFatRat We'll Meet Again Laura Brehm", cover: yt("pX1OyDnJbQI") },
  { id: "tfr-arcadia", title: "Arcadia", artist: "TheFatRat", genre: "Electronic", year: 2021, ytQuery: "TheFatRat Arcadia", cover: yt("bN-o4I9oKhE") },
  { id: "tfr-ruletheworld", title: "Rule The World", artist: "TheFatRat feat. AleXa", genre: "Pop Electronic", year: 2020, ytQuery: "TheFatRat Rule The World AleXa", cover: yt("U7RcJ-7h1P0") },
  { id: "tfr-hidingintheblue", title: "Hiding In The Blue", artist: "TheFatRat", genre: "Electronic", year: 2021, ytQuery: "TheFatRat Hiding In The Blue", cover: yt("U47d9wPnqJc") },
  { id: "tfr-ghostlight", title: "Ghost Light", artist: "TheFatRat feat. Cecilia Gault", genre: "Electronic", year: 2021, ytQuery: "TheFatRat Ghost Light Cecilia Gault", cover: yt("U47d9wPnqJc") },
  { id: "tfr-thestorm", title: "The Storm", artist: "TheFatRat feat. Maisy Kay", genre: "Electronic", year: 2019, ytQuery: "TheFatRat The Storm Maisy Kay", cover: yt("U47d9wPnqJc") },
  { id: "tfr-chosen", title: "Chosen", artist: "TheFatRat feat. Anna Yvette & Laura Brehm", genre: "Electronic", year: 2022, ytQuery: "TheFatRat Chosen Anna Yvette Laura Brehm", cover: yt("U47d9wPnqJc") },
  { id: "tfr-stronger", title: "Stronger", artist: "TheFatRat feat. Slaydit & Anjulie", genre: "Pop Electronic", year: 2022, ytQuery: "TheFatRat Stronger Slaydit Anjulie", cover: yt("U47d9wPnqJc") },
  { id: "tfr-sunlight", title: "Sunlight", artist: "TheFatRat", genre: "Electronic", year: 2014, ytQuery: "TheFatRat Sunlight", cover: yt("Y6cy3g8XCBs") },
  { id: "tfr-splinter", title: "Splinter", artist: "TheFatRat", genre: "Electronic", year: 2013, ytQuery: "TheFatRat Splinter", cover: yt("2A1IbJl0M4I") },
];

/* ─────────────── Alan Walker & Marshmello (Chart Your Course) ─────────────── */
export const alanWalkerMarshmelloTracks: CatalogEntry[] = [
  { id: "aw-faded", title: "Faded", artist: "Alan Walker", genre: "Electronic", year: 2015, ytQuery: "Alan Walker Faded", cover: yt("60ItHLz5WEA") },
  { id: "aw-alone", title: "Alone", artist: "Alan Walker", genre: "Electronic", year: 2016, ytQuery: "Alan Walker Alone", cover: yt("1-xGerv5FOk") },
  { id: "aw-aloneptii", title: "Alone, Pt. II", artist: "Alan Walker & Ava Max", genre: "Pop Electronic", year: 2019, ytQuery: "Alan Walker Ava Max Alone Pt II", cover: yt("QXQyFTTBLmo") },
  { id: "aw-darkside", title: "Darkside", artist: "Alan Walker feat. Au/Ra & Tomine Harket", genre: "Electronic", year: 2018, ytQuery: "Alan Walker Darkside", cover: yt("M-P4QBt-FWw") },
  { id: "aw-allfallsdown", title: "All Falls Down", artist: "Alan Walker feat. Noah Cyrus", genre: "Pop Electronic", year: 2017, ytQuery: "Alan Walker All Falls Down Noah Cyrus", cover: yt("6RLLOEzdxsM") },
  { id: "aw-onmyway", title: "On My Way", artist: "Alan Walker feat. Sabrina Carpenter & Farruko", genre: "Pop Electronic", year: 2019, ytQuery: "Alan Walker On My Way", cover: yt("4NnWuGQuFqA") },
  { id: "aw-headinghome", title: "Heading Home", artist: "Alan Walker feat. Ruben", genre: "Electronic", year: 2020, ytQuery: "Alan Walker Heading Home", cover: yt("5yFkMPOYQnI") },
  { id: "aw-play", title: "Play", artist: "Alan Walker feat. Tungevaag & Mangoo", genre: "Electronic", year: 2019, ytQuery: "Alan Walker K-391 Martin Tungevaag Play", cover: yt("EWHTLC59L90") },
  { id: "aw-ghost", title: "Ghost", artist: "Alan Walker feat. Au/Ra", genre: "Electronic", year: 2019, ytQuery: "Alan Walker Ghost Au/Ra", cover: yt("5yFkMPOYQnI") },
  { id: "aw-differentworld", title: "Different World", artist: "Alan Walker feat. K-391 & Sofia Carson", genre: "Electronic", year: 2018, ytQuery: "Alan Walker Different World", cover: yt("6RLLOEzdxsM") },
  { id: "aw-lostcontrol", title: "Lost Control", artist: "Alan Walker feat. Sorana", genre: "Electronic", year: 2018, ytQuery: "Alan Walker Lost Control Sorana", cover: yt("6RLLOEzdxsM") },
  { id: "aw-tired", title: "Tired", artist: "Alan Walker feat. Gavin James", genre: "Electronic", year: 2017, ytQuery: "Alan Walker Tired Gavin James", cover: yt("g4hGRvs6HHU") },
  { id: "aw-singmetosleep", title: "Sing Me to Sleep", artist: "Alan Walker", genre: "Electronic", year: 2016, ytQuery: "Alan Walker Sing Me to Sleep", cover: yt("2i2khp_npdE") },
  { id: "aw-routine", title: "Routine", artist: "Alan Walker & David Whistle", genre: "Electronic", year: 2016, ytQuery: "Alan Walker Routine", cover: yt("wL8DVHuWI7g") },
  { id: "aw-ignite", title: "Ignite", artist: "Alan Walker & K-391", genre: "Electronic", year: 2017, ytQuery: "Alan Walker K-391 Ignite", cover: yt("n4tK7LYFxI0") },
  { id: "aw-diamondheart", title: "Diamond Heart", artist: "Alan Walker feat. Sophia Somajo", genre: "Electronic", year: 2018, ytQuery: "Alan Walker Diamond Heart", cover: yt("6RLLOEzdxsM") },
  { id: "aw-lily", title: "Lily", artist: "Alan Walker feat. K-391 & Emelie Hollow", genre: "Electronic", year: 2018, ytQuery: "Alan Walker Lily K-391 Emelie Hollow", cover: yt("6RLLOEzdxsM") },
  { id: "aw-endoftime", title: "End of Time", artist: "Alan Walker & K-391 & Ahrix", genre: "Electronic", year: 2020, ytQuery: "Alan Walker K-391 Ahrix End of Time", cover: yt("6RLLOEzdxsM") },
  { id: "aw-manonthemoon", title: "Man on the Moon", artist: "Alan Walker feat. Benjamin Ingrosso", genre: "Pop Electronic", year: 2021, ytQuery: "Alan Walker Man on the Moon", cover: yt("6RLLOEzdxsM") },
  { id: "aw-lovesick", title: "Lovesick", artist: "Alan Walker feat. Sophie Stray", genre: "Pop Electronic", year: 2022, ytQuery: "Alan Walker Lovesick", cover: yt("6RLLOEzdxsM") },
  { id: "aw-hero", title: "Hero", artist: "Alan Walker feat. Sasha Alex Sloan", genre: "Pop Electronic", year: 2022, ytQuery: "Alan Walker Hero", cover: yt("6RLLOEzdxsM") },
  { id: "aw-betteroffalone", title: "Better Off (Alone)", artist: "Alan Walker & Dash Berlin & Vikkstar", genre: "Electronic", year: 2023, ytQuery: "Alan Walker Better Off Alone", cover: yt("6RLLOEzdxsM") },
  { id: "aw-whoiam", title: "Who I Am", artist: "Alan Walker feat. Peder Elias", genre: "Pop Electronic", year: 2023, ytQuery: "Alan Walker Who I Am", cover: yt("6RLLOEzdxsM") },
  { id: "aw-fire", title: "Fire!", artist: "Alan Walker & Yuqi & Jvke", genre: "Pop Electronic", year: 2023, ytQuery: "Alan Walker Fire Yuqi Jvke", cover: yt("6RLLOEzdxsM") },
  { id: "mm-alone", title: "Alone", artist: "Marshmello", genre: "Electronic", year: 2016, ytQuery: "Marshmello Alone", cover: yt("ALZHF5UqnU4") },
  { id: "mm-happier", title: "Happier", artist: "Marshmello feat. Bastille", genre: "Pop Electronic", year: 2018, ytQuery: "Marshmello Happier Bastille", cover: yt("m7Bc3pLyij0") },
  { id: "mm-silence", title: "Silence", artist: "Marshmello feat. Khalid", genre: "Pop Electronic", year: 2017, ytQuery: "Marshmello Silence Khalid", cover: yt("Tx1sqYc3qas") },
  { id: "mm-friends", title: "Friends", artist: "Marshmello & Anne-Marie", genre: "Pop Electronic", year: 2018, ytQuery: "Marshmello Friends Anne-Marie", cover: yt("jzD_yyEcp0M") },
  { id: "mm-wolves", title: "Wolves", artist: "Marshmello & Selena Gomez", genre: "Pop Electronic", year: 2017, ytQuery: "Marshmello Wolves Selena Gomez", cover: yt("QaXhVryxVBk") },
  { id: "mm-spotlight", title: "Spotlight", artist: "Marshmello & Lil Peep", genre: "Electronic", year: 2018, ytQuery: "Marshmello Spotlight Lil Peep", cover: yt("ALZHF5UqnU4") },
  { id: "mm-flashbacks", title: "Flashbacks", artist: "Marshmello", genre: "Electronic", year: 2021, ytQuery: "Marshmello Flashbacks", cover: yt("ALZHF5UqnU4") },
  { id: "mm-leavebefore", title: "Leave Before You Love Me", artist: "Marshmello & Jonas Brothers", genre: "Pop", year: 2021, ytQuery: "Marshmello Leave Before You Love Me", cover: yt("ALZHF5UqnU4") },
  { id: "mm-numb", title: "Numb", artist: "Marshmello & Khalid", genre: "Pop Electronic", year: 2022, ytQuery: "Marshmello Numb Khalid", cover: yt("ALZHF5UqnU4") },
  { id: "mm-elmerengue", title: "El Merengue", artist: "Marshmello & Manuel Turizo", genre: "Latin Electronic", year: 2023, ytQuery: "Marshmello El Merengue", cover: yt("ALZHF5UqnU4") },
  { id: "mm-tempo", title: "Tempo", artist: "Marshmello & Southside", genre: "Trap", year: 2023, ytQuery: "Marshmello Tempo Southside", cover: yt("ALZHF5UqnU4") },
  { id: "mm-shockwave", title: "Shockwave", artist: "Marshmello", genre: "Electronic", year: 2021, ytQuery: "Marshmello Shockwave", cover: yt("ALZHF5UqnU4") },
  { id: "mm-fairytale", title: "Fairytale", artist: "Marshmello & Alexander Stewart", genre: "Pop", year: 2022, ytQuery: "Marshmello Fairytale", cover: yt("ALZHF5UqnU4") },
  { id: "mm-ritual", title: "Ritual", artist: "Marshmello & Wrabel", genre: "Pop Electronic", year: 2019, ytQuery: "Marshmello Ritual Wrabel", cover: yt("ALZHF5UqnU4") },
  { id: "mm-herewithme", title: "Here with Me", artist: "Marshmello feat. CHVRCHES", genre: "Pop Electronic", year: 2019, ytQuery: "Marshmello Here with Me CHVRCHES", cover: yt("ALZHF5UqnU4") },
  { id: "mm-proud", title: "Proud", artist: "Marshmello feat. Khalid", genre: "Pop", year: 2020, ytQuery: "Marshmello Proud Khalid", cover: yt("ALZHF5UqnU4") },
  { id: "mm-power", title: "Power", artist: "Marshmello", genre: "Electronic", year: 2019, ytQuery: "Marshmello Power", cover: yt("ALZHF5UqnU4") },
  { id: "mm-onethingright", title: "One Thing Right", artist: "Marshmello & Kane Brown", genre: "Country Electronic", year: 2019, ytQuery: "Marshmello One Thing Right Kane Brown", cover: yt("ALZHF5UqnU4") },
  { id: "mm-checkthisout", title: "Check This Out", artist: "Marshmello", genre: "Electronic", year: 2018, ytQuery: "Marshmello Check This Out", cover: yt("ALZHF5UqnU4") },
  { id: "mm-movingon", title: "Moving On", artist: "Marshmello", genre: "Electronic", year: 2017, ytQuery: "Marshmello Moving On", cover: yt("ALZHF5UqnU4") },
];

/* ─────────────── NCS famous classics ─────────────── */
export const ncsFamousTracks: CatalogEntry[] = [
  { id: "ncs-fade", title: "Fade", artist: "Alan Walker", genre: "Electronic", year: 2014, ytQuery: "Alan Walker Fade NCS", cover: yt("bM7SZ5SBzyY") },
  { id: "ncs-spectre", title: "Spectre", artist: "Alan Walker", genre: "Electronic", year: 2015, ytQuery: "Alan Walker Spectre NCS", cover: yt("AOeY-nDp7hI") },
  { id: "ncs-force", title: "Force", artist: "Alan Walker", genre: "Electronic", year: 2015, ytQuery: "Alan Walker Force NCS", cover: yt("xshEZzpS4CQ") },
  { id: "ncs-onandon", title: "On & On", artist: "Cartoon feat. Daniel Levi", genre: "Electronic", year: 2015, ytQuery: "Cartoon On and On Daniel Levi", cover: yt("K4DyBUG242c") },
  { id: "ncs-firefly", title: "Firefly", artist: "Jim Yosef", genre: "Electronic", year: 2015, ytQuery: "Jim Yosef Firefly NCS", cover: yt("G7KNmW9a75Y") },
  { id: "ncs-hope", title: "Hope", artist: "Tobu", genre: "Electronic", year: 2014, ytQuery: "Tobu Hope NCS", cover: yt("EP625xQIGzs") },
  { id: "ncs-candyland", title: "Candyland", artist: "Tobu", genre: "Electronic", year: 2015, ytQuery: "Tobu Candyland NCS", cover: yt("IIrCDAV3EgI") },
  { id: "ncs-life", title: "Life", artist: "Tobu", genre: "Electronic", year: 2014, ytQuery: "Tobu Life NCS Release", cover: yt("h18gwLKQf_Q") },
  { id: "ncs-infectious", title: "Infectious", artist: "Tobu", genre: "Electronic", year: 2014, ytQuery: "Tobu Infectious NCS", cover: yt("MEJCwccKWG0") },
  { id: "ncs-symbolism", title: "Symbolism", artist: "Electro-Light", genre: "Electronic", year: 2014, ytQuery: "Electro-Light Symbolism NCS", cover: yt("C__0cW4yIdE") },
  { id: "ncs-blank", title: "Blank", artist: "Disfigure", genre: "Electronic", year: 2013, ytQuery: "Disfigure Blank NCS", cover: yt("p7ZsBPK656s") },
  { id: "ncs-invincible", title: "Invincible", artist: "DEAF KEV", genre: "Electronic", year: 2015, ytQuery: "DEAF KEV Invincible NCS", cover: yt("J2X5mJ3HDYE") },
  { id: "ncs-nekozilla", title: "Nekozilla", artist: "Different Heaven", genre: "Dubstep", year: 2013, ytQuery: "Different Heaven Nekozilla NCS", cover: yt("6FNHe3kf8_s") },
  { id: "ncs-heroes", title: "Heroes Tonight", artist: "Janji feat. Johnning", genre: "Electronic", year: 2015, ytQuery: "Janji Heroes Tonight Johnning NCS", cover: yt("3nQNiWdeH2Q") },
  { id: "ncs-earth", title: "Earth", artist: "K-391", genre: "Electronic", year: 2016, ytQuery: "K-391 Earth NCS", cover: yt("n4tK7LYFxI0") },
  { id: "ncs-nova", title: "Nova", artist: "Ahrix", genre: "Electronic", year: 2013, ytQuery: "Ahrix Nova NCS", cover: yt("c82lGJ4V_RI") },
  { id: "ncs-superhero", title: "Superhero", artist: "Unknown Brain feat. Chris Linton", genre: "Electronic", year: 2017, ytQuery: "Unknown Brain Superhero Chris Linton NCS", cover: yt("LHvYrn3FAgI") },
  { id: "ncs-adventure", title: "Adventure", artist: "JJD", genre: "Electronic", year: 2016, ytQuery: "JJD Adventure NCS", cover: yt("f2xGxd9xPYA") },
  { id: "ncs-cloud9", title: "Cloud 9", artist: "Itro & Tobu", genre: "Electronic", year: 2014, ytQuery: "Itro Tobu Cloud 9 NCS", cover: yt("VtKbiyyVZks") },
  { id: "ncs-feelgood", title: "Feel Good", artist: "Syn Cole", genre: "House", year: 2016, ytQuery: "Syn Cole Feel Good NCS", cover: yt("q1ULJ92aldE") },
  { id: "ncs-tropiclove", title: "Tropic Love", artist: "Diviners feat. Contacreast", genre: "Tropical House", year: 2016, ytQuery: "Diviners Tropic Love Contacreast NCS", cover: yt("u6RJv7f__Mg") },
  { id: "ncs-fearless", title: "Fearless", artist: "Lost Sky", genre: "Electronic", year: 2018, ytQuery: "Lost Sky Fearless NCS", cover: yt("YQGWcMDOFc0") },
  { id: "ncs-mortals", title: "Mortals", artist: "Warriyo feat. Laura Brehm", genre: "Electronic", year: 2017, ytQuery: "Warriyo Mortals Laura Brehm NCS", cover: yt("yJg-Y5byMMw") },
  { id: "ncs-dreams", title: "Dreams", artist: "Lost Sky", genre: "Electronic", year: 2019, ytQuery: "Lost Sky Dreams NCS", cover: yt("YQGWcMDOFc0") },
  { id: "ncs-link", title: "Link", artist: "Jim Yosef", genre: "Electronic", year: 2016, ytQuery: "Jim Yosef Link NCS", cover: yt("G7KNmW9a75Y") },
  { id: "ncs-royalty", title: "Royalty", artist: "Egzod & Maestro Chives", genre: "Electronic", year: 2020, ytQuery: "Egzod Maestro Chives Royalty NCS", cover: yt("3lQgMqRbMRQ") },
  { id: "ncs-eclipse", title: "Eclipse", artist: "Jim Yosef", genre: "Electronic", year: 2017, ytQuery: "Jim Yosef Eclipse NCS", cover: yt("G7KNmW9a75Y") },
  { id: "ncs-sunburst", title: "Sunburst", artist: "Tobu & Itro", genre: "Electronic", year: 2014, ytQuery: "Tobu Itro Sunburst NCS", cover: yt("IIrCDAV3EgI") },
  { id: "ncs-colors", title: "Colors", artist: "Tobu", genre: "Electronic", year: 2015, ytQuery: "Tobu Colors NCS", cover: yt("EP625xQIGzs") },
  { id: "ncs-higher", title: "Higher", artist: "Tobu", genre: "Electronic", year: 2015, ytQuery: "Tobu Higher NCS", cover: yt("EP625xQIGzs") },
  { id: "ncs-soundofgoodbye", title: "Sound of Goodbye", artist: "Armin van Buuren (NCS Remix)", genre: "Trance", year: 2015, ytQuery: "Sound of Goodbye NCS Remix", cover: yt("3nQNiWdeH2Q") },
];

/* ─────────────── NEFFEX ─────────────── */
export const neffexTracks: CatalogEntry[] = [
  { id: "nfx-fightback", title: "Fight Back", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2018, ytQuery: "NEFFEX Fight Back", cover: yt("QhYh0f5r3yU") },
  { id: "nfx-bestofme", title: "Best of Me", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2017, ytQuery: "NEFFEX Best of Me", cover: yt("zyXmsVwZqX4") },
  { id: "nfx-grateful", title: "Grateful", artist: "NEFFEX", genre: "Hip Hop", year: 2018, ytQuery: "NEFFEX Grateful", cover: yt("Q3GjgKqJG1Q") },
  { id: "nfx-destiny", title: "Destiny", artist: "NEFFEX", genre: "Hip Hop", year: 2018, ytQuery: "NEFFEX Destiny", cover: yt("bQJQGoJF7_k") },
  { id: "nfx-cold", title: "Cold", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2018, ytQuery: "NEFFEX Cold", cover: yt("a2YniJmNGsA") },
  { id: "nfx-rumors", title: "Rumors", artist: "NEFFEX", genre: "Hip Hop", year: 2019, ytQuery: "NEFFEX Rumors", cover: yt("QhYh0f5r3yU") },
  { id: "nfx-careless", title: "Careless", artist: "NEFFEX", genre: "Hip Hop", year: 2017, ytQuery: "NEFFEX Careless", cover: yt("zyXmsVwZqX4") },
  { id: "nfx-failure", title: "Failure", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2019, ytQuery: "NEFFEX Failure", cover: yt("QhYh0f5r3yU") },
  { id: "nfx-chance", title: "Chance", artist: "NEFFEX", genre: "Hip Hop", year: 2019, ytQuery: "NEFFEX Chance", cover: yt("bQJQGoJF7_k") },
  { id: "nfx-crown", title: "Crown", artist: "NEFFEX", genre: "Hip Hop", year: 2020, ytQuery: "NEFFEX Crown", cover: yt("Q3GjgKqJG1Q") },
  { id: "nfx-headup", title: "Head Up", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2020, ytQuery: "NEFFEX Head Up", cover: yt("QhYh0f5r3yU") },
  { id: "nfx-alive", title: "Alive", artist: "NEFFEX", genre: "Hip Hop", year: 2020, ytQuery: "NEFFEX Alive", cover: yt("zyXmsVwZqX4") },
  { id: "nfx-soldier", title: "Soldier", artist: "NEFFEX", genre: "Hip Hop / Rock", year: 2020, ytQuery: "NEFFEX Soldier", cover: yt("a2YniJmNGsA") },
  { id: "nfx-unstoppable", title: "Unstoppable", artist: "NEFFEX", genre: "Hip Hop", year: 2021, ytQuery: "NEFFEX Unstoppable", cover: yt("QhYh0f5r3yU") },
  { id: "nfx-dreams", title: "Dreams", artist: "NEFFEX", genre: "Hip Hop", year: 2021, ytQuery: "NEFFEX Dreams", cover: yt("bQJQGoJF7_k") },
];

/* ─────────────── Kevin MacLeod ─────────────── */
export const kevinMacleodBase: CatalogEntry[] = [
  { id: "km-monkeys", title: "Monkeys Spinning Monkeys", artist: "Kevin MacLeod", genre: "Comedy", year: 2014, ytQuery: "Kevin MacLeod Monkeys Spinning Monkeys", cover: "" },
  { id: "km-sneaky", title: "Sneaky Snitch", artist: "Kevin MacLeod", genre: "Comedy", year: 2013, ytQuery: "Kevin MacLeod Sneaky Snitch", cover: "" },
  { id: "km-fluffing", title: "Fluffing a Duck", artist: "Kevin MacLeod", genre: "Comedy", year: 2013, ytQuery: "Kevin MacLeod Fluffing a Duck", cover: "" },
  { id: "km-scheming", title: "Scheming Weasel", artist: "Kevin MacLeod", genre: "Comedy", year: 2013, ytQuery: "Kevin MacLeod Scheming Weasel", cover: "" },
  { id: "km-investigations", title: "Investigations", artist: "Kevin MacLeod", genre: "Cinematic", year: 2014, ytQuery: "Kevin MacLeod Investigations", cover: "" },
  { id: "km-darkness", title: "Darkness is Coming", artist: "Kevin MacLeod", genre: "Horror", year: 2014, ytQuery: "Kevin MacLeod Darkness is Coming", cover: "" },
];

/* ─────────────── Geometry Dash OST · 🟢 Main Levels ─────────────── */
export const gdMainLevels: CatalogEntry[] = [
  { id: "gd-stereo", title: "Stereo Madness", artist: "ForeverBound", genre: "Electronic", year: 2013, ytQuery: "ForeverBound Stereo Madness Geometry Dash", cover: "" },
  { id: "gd-backontrack", title: "Back on Track", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI Back on Track Geometry Dash", cover: "" },
  { id: "gd-polargeist", title: "Polargeist", artist: "Step", genre: "Electronic", year: 2013, ytQuery: "Step Polargeist Geometry Dash", cover: "" },
  { id: "gd-dryout", title: "Dry Out", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI Dry Out Geometry Dash", cover: "" },
  { id: "gd-baseafterbase", title: "Base After Base", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI Base After Base Geometry Dash", cover: "" },
  { id: "gd-cantletgo", title: "Can't Let Go", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI Can't Let Go Geometry Dash", cover: "" },
  { id: "gd-jumper", title: "Jumper", artist: "Waterflame", genre: "Electronic", year: 2013, ytQuery: "Waterflame Jumper Geometry Dash", cover: "" },
  { id: "gd-timemachine", title: "Time Machine", artist: "Waterflame", genre: "Electronic", year: 2013, ytQuery: "Waterflame Time Machine Geometry Dash", cover: "" },
  { id: "gd-cycles", title: "Cycles", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI Cycles Geometry Dash", cover: "" },
  { id: "gd-xstep", title: "xStep", artist: "DJVI", genre: "Electronic", year: 2013, ytQuery: "DJVI xStep Geometry Dash", cover: "" },
  { id: "gd-clutterfunk", title: "Clutterfunk", artist: "Waterflame", genre: "Electronic", year: 2013, ytQuery: "Waterflame Clutterfunk Geometry Dash", cover: "" },
  { id: "gd-theoryofeverything", title: "Theory of Everything", artist: "DJ-Nate", genre: "Electronic", year: 2013, ytQuery: "DJ-Nate Theory of Everything Geometry Dash", cover: "" },
  { id: "gd-electroman", title: "Electroman Adventures", artist: "Waterflame", genre: "Electronic", year: 2013, ytQuery: "Waterflame Electroman Adventures Geometry Dash", cover: "" },
  { id: "gd-clubstep", title: "Clubstep", artist: "DJ-Nate", genre: "Electronic", year: 2013, ytQuery: "DJ-Nate Clubstep Geometry Dash", cover: "" },
  { id: "gd-electrodynamix", title: "Electrodynamix", artist: "DJ-Nate", genre: "Electronic", year: 2013, ytQuery: "DJ-Nate Electrodynamix Geometry Dash", cover: "" },
  { id: "gd-hexagonforce", title: "Hexagon Force", artist: "Waterflame", genre: "Electronic", year: 2014, ytQuery: "Waterflame Hexagon Force Geometry Dash", cover: "" },
  { id: "gd-blastprocessing", title: "Blast Processing", artist: "Waterflame", genre: "Electronic", year: 2014, ytQuery: "Waterflame Blast Processing Geometry Dash", cover: "" },
  { id: "gd-toe2", title: "Theory of Everything 2", artist: "DJ-Nate", genre: "Electronic", year: 2014, ytQuery: "DJ-Nate Theory of Everything 2 Geometry Dash", cover: "" },
  { id: "gd-geometricaldominator", title: "Geometrical Dominator", artist: "Waterflame", genre: "Electronic", year: 2014, ytQuery: "Waterflame Geometrical Dominator Geometry Dash", cover: "" },
  { id: "gd-deadlocked", title: "Deadlocked", artist: "F-777", genre: "Electronic", year: 2015, ytQuery: "F-777 Deadlocked", cover: "" },
  { id: "gd-fingerdash", title: "Fingerdash", artist: "MDK", genre: "Electronic", year: 2017, ytQuery: "MDK Fingerdash Geometry Dash song", cover: "" },
];

/* ─────────────── Geometry Dash OST · 🔵 Meltdown & Subzero ─────────────── */
export const gdMeltdownSubzero: CatalogEntry[] = [
  { id: "gd-sevenseas", title: "The Seven Seas", artist: "F-777", genre: "Electronic", year: 2016, ytQuery: "F-777 The Seven Seas", cover: "" },
  { id: "gd-vikingarena", title: "Viking Arena", artist: "F-777", genre: "Electronic", year: 2016, ytQuery: "F-777 Viking Arena", cover: "" },
  { id: "gd-airbornerobots", title: "Airborne Robots", artist: "F-777", genre: "Electronic", year: 2016, ytQuery: "F-777 Airborne Robots", cover: "" },
  { id: "gd-payload", title: "Payload", artist: "Dex Arson", genre: "Electronic", year: 2017, ytQuery: "Dex Arson Payload", cover: "" },
  { id: "gd-beastmode", title: "Beast Mode", artist: "Dex Arson", genre: "Electronic", year: 2017, ytQuery: "Dex Arson Beast Mode", cover: "" },
  { id: "gd-machina", title: "Machina", artist: "Dex Arson", genre: "Electronic", year: 2017, ytQuery: "Dex Arson Machina", cover: "" },
];

/* ─────────────── Geometry Dash OST · 🔴 Classic Demons ─────────────── */
export const gdClassicDemons: CatalogEntry[] = [
  { id: "gd-cataclysm", title: "Cataclysm", artist: "Ggb0y", genre: "Dubstep", year: 2015, ytQuery: "Ggb0y Cataclysm", cover: "" },
  { id: "gd-aftermath", title: "Aftermath", artist: "Ggb0y", genre: "Dubstep", year: 2015, ytQuery: "Ggb0y Aftermath", cover: "" },
  { id: "gd-bloodbath", title: "Bloodbath", artist: "Riot", genre: "Dubstep", year: 2015, ytQuery: "Riot Bloodbath", cover: "" },
  { id: "gd-yatagarasu", title: "Yatagarasu", artist: "TrusTa", genre: "Electronic", year: 2016, ytQuery: "TrusTa Yatagarasu", cover: "" },
  { id: "gd-firework", title: "Firework", artist: "TrusTa", genre: "Electronic", year: 2016, ytQuery: "TrusTa Firework", cover: "" },
  { id: "gd-acu", title: "Acu", artist: "Neigefeu", genre: "Electronic", year: 2016, ytQuery: "Neigefeu Acu", cover: "" },
  { id: "gd-bloodlust", title: "Bloodlust", artist: "Knobbelboy", genre: "Dubstep", year: 2017, ytQuery: "Knobbelboy Bloodlust", cover: "" },
  { id: "gd-sakupencircles", title: "Sakupen Circles", artist: "Diamond", genre: "Electronic", year: 2017, ytQuery: "Diamond Sakupen Circles", cover: "" },
  { id: "gd-silentclubstep", title: "Silent Clubstep", artist: "F-777", genre: "Electronic", year: 2016, ytQuery: "F-777 Silent Clubstep", cover: "" },
];

/* ─────────────── Geometry Dash OST · 💀 Extreme Demons ─────────────── */
export const gdExtremeDemons: CatalogEntry[] = [
  { id: "gd-sonicwave", title: "Sonic Wave", artist: "Cyclic", genre: "Electronic", year: 2017, ytQuery: "Cyclic Sonic Wave", cover: "" },
  { id: "gd-slaughterhouse", title: "Slaughterhouse", artist: "iKz", genre: "Dubstep", year: 2020, ytQuery: "iKz Slaughterhouse full song", cover: "" },
  { id: "gd-acheron", title: "Acheron", artist: "Ryamu", genre: "Electronic", year: 2020, ytQuery: "Ryamu Acheron", cover: "" },
  { id: "gd-thegolden", title: "The Golden", artist: "Creo", genre: "Electronic", year: 2019, ytQuery: "Creo The Golden", cover: "" },
  { id: "gd-arcturus", title: "Arcturus", artist: "Viprin", genre: "Electronic", year: 2019, ytQuery: "Viprin Arcturus", cover: "" },
  { id: "gd-kocmoc", title: "KOCMOC", artist: "Cherry Team", genre: "Dubstep", year: 2021, ytQuery: "KOCMOC Cherry Team song", cover: "" },
  { id: "gd-tidalwave", title: "Tidal Wave", artist: "OniLink", genre: "Electronic", year: 2021, ytQuery: "OniLink Tidal Wave", cover: "" },
  { id: "gd-kenos", title: "Kenos", artist: "Npesta", genre: "Electronic", year: 2021, ytQuery: "Npesta Kenos", cover: "" },
  { id: "gd-limbo", title: "Limbo", artist: "MindCap", genre: "Electronic", year: 2020, ytQuery: "MindCap Limbo", cover: "" },
  { id: "gd-zaphkiel", title: "Zaphkiel", artist: "Darwin & Noctafly", genre: "Electronic", year: 2021, ytQuery: "Darwin Noctafly Zaphkiel", cover: "" },
  { id: "gd-esfera", title: "Esfera", artist: "Zobros", genre: "Electronic", year: 2018, ytQuery: "Zobros Esfera", cover: "" },
  { id: "gd-grimoireofdarkness", title: "Grimoire of Darkness", artist: "Team Grimoire", genre: "Dubstep", year: 2019, ytQuery: "Team Grimoire Grimoire of Darkness", cover: "" },
  { id: "gd-theyandere", title: "The Yandere", artist: "Rynox", genre: "Electronic", year: 2020, ytQuery: "The Yandere Geometry Dash full song", cover: "" },
  { id: "gd-crimsonplanet", title: "Crimson Planet", artist: "TrusTa", genre: "Electronic", year: 2018, ytQuery: "TrusTa Crimson Planet", cover: "" },
  { id: "gd-renevant", title: "Renevant", artist: "Nikroplays", genre: "Electronic", year: 2019, ytQuery: "RENEVANT Full Song Geometry Dash", cover: "" },
  { id: "gd-ouroboros", title: "Ouroboros", artist: "GrenadeofTacos", genre: "Dubstep", year: 2020, ytQuery: "GrenadeofTacos Ouroboros Geometry Dash song", cover: "" },
  { id: "gd-erebus", title: "Erebus", artist: "BoldStep", genre: "Electronic", year: 2021, ytQuery: "BoldStep Erebus", cover: "" },
  { id: "gd-deimos", title: "Deimos", artist: "EndLevel", genre: "Electronic", year: 2019, ytQuery: "Solkrieg Deimos Geometry Dash", cover: "" },
];

/* ─────────────── Geometry Dash OST · 🌐 Demon List Extras ─────────────── */
export const gdDemonListExtras: CatalogEntry[] = [
  { id: "gd-whitespace", title: "White Space", artist: "Ddammn", genre: "Electronic", year: 2021, ytQuery: "White Space Geometry Dash song", cover: "" },
  { id: "gd-menace", title: "Menace", artist: "Iced", genre: "Electronic", year: 2021, ytQuery: "Iced Menace", cover: "" },
  { id: "gd-freedom", title: "Freedom", artist: "Dolphy & Lexi", genre: "Electronic", year: 2022, ytQuery: "Dolphy Lexi Freedom", cover: "" },
  { id: "gd-sigma", title: "Sigma", artist: "Spuze", genre: "Electronic", year: 2020, ytQuery: "Sigma Geometry Dash song", cover: "" },
  { id: "gd-ninecircles", title: "Nine Circles", artist: "Zobros", genre: "Electronic", year: 2015, ytQuery: "Zobros Nine Circles", cover: "" },
  { id: "gd-sonicwaverebirth", title: "Sonic Wave Rebirth", artist: "Cyclic", genre: "Electronic", year: 2019, ytQuery: "Sonic Wave Rebirth Cyclic song", cover: "" },
];

/* ─────────────── Kevin MacLeod · additional real works ─────────────── */
export const kevinMacleodExtras: CatalogEntry[] = [
  { id: "km-carefree", title: "Carefree", artist: "Kevin MacLeod", genre: "Comedy", year: 2013, ytQuery: "Kevin MacLeod Carefree", cover: "" },
  { id: "km-cipher", title: "Cipher", artist: "Kevin MacLeod", genre: "Electronic", year: 2013, ytQuery: "Kevin MacLeod Cipher", cover: "" },
  { id: "km-pixelland", title: "Pixelland", artist: "Kevin MacLeod", genre: "Cinematic", year: 2013, ytQuery: "Kevin MacLeod Pixelland", cover: "" },
  { id: "km-electrodoodle", title: "Electrodoodle", artist: "Kevin MacLeod", genre: "Electronic", year: 2013, ytQuery: "Kevin MacLeod Electrodoodle", cover: "" },
];

/* ─────────────── Undertale · 🌱 Start & Ruins ─────────────── */
export const undertaleRuins: CatalogEntry[] = [
  { id: "ut-onceuponatime", title: "Once Upon a Time", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Once Upon a Time Undertale", cover: "" },
  { id: "ut-yourbestfriend", title: "Your Best Friend", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Your Best Friend Undertale", cover: "" },
  { id: "ut-fallendown", title: "Fallen Down", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Fallen Down Undertale", cover: "" },
  { id: "ut-ruins", title: "Ruins", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Ruins Undertale", cover: "" },
  { id: "ut-anticipation", title: "Anticipation", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Anticipation Undertale", cover: "" },
  { id: "ut-unnecessarytension", title: "Unnecessary Tension", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Unnecessary Tension Undertale", cover: "" },
];

/* ─────────────── Undertale · ❄️ Snowdin ─────────────── */
export const undertaleSnowdin: CatalogEntry[] = [
  { id: "ut-snowdintown", title: "Snowdin Town", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Snowdin Town Undertale", cover: "" },
  { id: "ut-dogsong", title: "Dogsong", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Dogsong Undertale", cover: "" },
  { id: "ut-bonetrousle", title: "Bonetrousle", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Bonetrousle Undertale", cover: "" },
  { id: "ut-nyehhehheh", title: "Nyeh Heh Heh!", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Nyeh Heh Heh Undertale", cover: "" },
  { id: "ut-sans", title: "Sans.", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Sans Undertale", cover: "" },
  { id: "ut-snowy", title: "Snowy", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Snowy Undertale", cover: "" },
  { id: "ut-shop", title: "Shop", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Shop Undertale OST", cover: "" },
];

/* ─────────────── Undertale · 💧 Waterfall ─────────────── */
export const undertaleWaterfall: CatalogEntry[] = [
  { id: "ut-waterfall", title: "Waterfall", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Waterfall Undertale", cover: "" },
  { id: "ut-quietwater", title: "Quiet Water", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Quiet Water Undertale", cover: "" },
  { id: "ut-undyne", title: "Undyne", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Undyne Undertale", cover: "" },
  { id: "ut-spearofjustice", title: "Spear of Justice", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Spear of Justice Undertale", cover: "" },
  { id: "ut-temmievillage", title: "Temmie Village", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Temmie Village Undertale", cover: "" },
  { id: "ut-temshop", title: "Tem Shop", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Tem Shop Undertale", cover: "" },
  { id: "ut-anothermedium", title: "Another Medium", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Another Medium Undertale", cover: "" },
  { id: "ut-memory", title: "Memory", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Memory Undertale", cover: "" },
  { id: "ut-dummy", title: "Dummy!", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Dummy Undertale", cover: "" },
];

/* ─────────────── Undertale · 🔥 Hotland & CORE ─────────────── */
export const undertaleHotland: CatalogEntry[] = [
  { id: "ut-alphys", title: "Alphys", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Alphys Undertale", cover: "" },
  { id: "ut-itsrainingsomewhereelse", title: "It's Raining Somewhere Else", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox It's Raining Somewhere Else Undertale", cover: "" },
  { id: "ut-metalcrusher", title: "Metal Crusher", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Metal Crusher Undertale", cover: "" },
  { id: "ut-ohdungeon", title: "Oh! Dungeon", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Oh Dungeon Undertale", cover: "" },
  { id: "ut-confession", title: "Confession", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Confession Undertale", cover: "" },
  { id: "ut-livereport", title: "Live Report", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Live Report Undertale", cover: "" },
  { id: "ut-deathbyglamour", title: "Death by Glamour", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Death by Glamour Undertale", cover: "" },
  { id: "ut-hotel", title: "Hotel", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Hotel Undertale", cover: "" },
  { id: "ut-core", title: "CORE", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox CORE Undertale", cover: "" },
  { id: "ut-spiderdance", title: "Spider Dance", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Spider Dance Undertale", cover: "" },
];

/* ─────────────── Undertale · ⚔️ Boss Battles ─────────────── */
export const undertaleBosses: CatalogEntry[] = [
  { id: "ut-heartache", title: "Heartache", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Heartache Undertale", cover: "" },
  { id: "ut-megalovania", title: "MEGALOVANIA", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox MEGALOVANIA Undertale", cover: "" },
  { id: "ut-battleagainstatruehero", title: "Battle Against a True Hero", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Battle Against a True Hero Undertale", cover: "" },
  { id: "ut-asgore", title: "ASGORE", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox ASGORE Undertale", cover: "" },
  { id: "ut-bergentruckung", title: "Bergentrückung", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Bergentruckung Undertale", cover: "" },
  { id: "ut-yourbestnightmare", title: "Your Best Nightmare", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Your Best Nightmare Undertale", cover: "" },
  { id: "ut-bringitinguys", title: "Bring It In, Guys!", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Bring It In Guys Undertale", cover: "" },
  { id: "ut-hopesanddreams", title: "Hopes and Dreams", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Hopes and Dreams Undertale", cover: "" },
  { id: "ut-savetheworld", title: "SAVE the World", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox SAVE the World Undertale", cover: "" },
];

/* ─────────────── Undertale · 🎭 Endings & Secrets ─────────────── */
export const undertaleEndings: CatalogEntry[] = [
  { id: "ut-undertale", title: "Undertale", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Undertale theme", cover: "" },
  { id: "ut-anending", title: "An Ending", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox An Ending Undertale", cover: "" },
  { id: "ut-finale", title: "Finale", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Finale Undertale", cover: "" },
  { id: "ut-smallshock", title: "Small Shock", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Small Shock Undertale", cover: "" },
  { id: "ut-shesplayingpiano", title: "She's Playing Piano", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox She's Playing Piano Undertale", cover: "" },
  { id: "ut-lastgoodbye", title: "Last Goodbye", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox Last Goodbye Undertale", cover: "" },
  { id: "ut-gasterstheme", title: "Gaster's Theme", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Undertale Gaster's Theme Toby Fox", cover: "" },
  { id: "ut-thechoice", title: "The Choice", artist: "Toby Fox", genre: "Undertale OST", year: 2015, ytQuery: "Toby Fox The Choice Undertale", cover: "" },
];

export const allUndertaleTracks: CatalogEntry[] = [
  ...undertaleRuins,
  ...undertaleSnowdin,
  ...undertaleWaterfall,
  ...undertaleHotland,
  ...undertaleBosses,
  ...undertaleEndings,
];

export const UNDERTALE_SUB_GROUPS = [
  { label: "🌱 Start & Ruins", entries: undertaleRuins },
  { label: "❄️ Snowdin", entries: undertaleSnowdin },
  { label: "💧 Waterfall", entries: undertaleWaterfall },
  { label: "🔥 Hotland & CORE", entries: undertaleHotland },
  { label: "⚔️ Boss Battles", entries: undertaleBosses },
  { label: "🎭 Endings & Secrets", entries: undertaleEndings },
];

/* ─────────────── The Living Tombstone · 🎮 FNAF & Gaming ─────────────── */
export const tltGaming: CatalogEntry[] = [
  { id: "tlt-fnaf1", title: "Five Nights at Freddy's Song", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2014, ytQuery: "The Living Tombstone Five Nights at Freddy's Song", cover: "" },
  { id: "tlt-itsbeensolong", title: "It's Been So Long", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2014, ytQuery: "The Living Tombstone It's Been So Long", cover: "" },
  { id: "tlt-thiscomesfrominside", title: "This Comes From Inside", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2021, ytQuery: "The Living Tombstone This Comes From Inside", cover: "" },
  { id: "tlt-itdoesnt", title: "It Doesn't (Secret of the Mimic Song)", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2025, ytQuery: "The Living Tombstone Secret of the Mimic Song", cover: "" },
  { id: "tlt-basicsinbehavior", title: "Basics in Behavior (Baldi's Basics)", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2018, ytQuery: "The Living Tombstone Basics in Behavior", cover: "" },
  { id: "tlt-iwannabeamachine", title: "I Wanna Be A Machine", artist: "The Living Tombstone", genre: "FNAF & Gaming", year: 2019, ytQuery: "The Living Tombstone I Wanna Be A Machine", cover: "" },
];

/* ─────────────── The Living Tombstone · 🎤 Originals ─────────────── */
export const tltOriginals: CatalogEntry[] = [
  { id: "tlt-myordinarylife", title: "My Ordinary Life", artist: "The Living Tombstone", genre: "Originals", year: 2018, ytQuery: "The Living Tombstone My Ordinary Life", cover: "" },
  { id: "tlt-donthangupthecall", title: "Don't Hang Up The Call", artist: "The Living Tombstone", genre: "Originals", year: 2023, ytQuery: "The Living Tombstone Don't Hang Up The Call", cover: "" },
  { id: "tlt-icantfixyou", title: "I Can't Fix You", artist: "The Living Tombstone", genre: "Originals", year: 2017, ytQuery: "The Living Tombstone I Can't Fix You", cover: "" },
  { id: "tlt-steponup", title: "Step On Up", artist: "The Living Tombstone", genre: "Originals", year: 2022, ytQuery: "The Living Tombstone Step On Up", cover: "" },
  { id: "tlt-bealone", title: "Be Alone", artist: "The Living Tombstone", genre: "Originals", year: 2021, ytQuery: "The Living Tombstone Be Alone", cover: "" },
  { id: "tlt-drunk", title: "Drunk", artist: "The Living Tombstone", genre: "Originals", year: 2017, ytQuery: "The Living Tombstone Drunk", cover: "" },
  { id: "tlt-discord", title: "Discord", artist: "The Living Tombstone", genre: "Originals", year: 2012, ytQuery: "The Living Tombstone Discord", cover: "" },
];

/* ─────────────── The Living Tombstone · 🤝 Collabs & Remixes ─────────────── */
export const tltCollabs: CatalogEntry[] = [
  { id: "tlt-4get", title: "4GET (with CG5 feat. OR3O)", artist: "The Living Tombstone & CG5", genre: "Collabs & Remixes", year: 2020, ytQuery: "CG5 The Living Tombstone 4GET", cover: "" },
  { id: "tlt-fighttilimgoodenough", title: "Fight Til' I'm Good Enough (Murder Drones)", artist: "The Living Tombstone", genre: "Collabs & Remixes", year: 2023, ytQuery: "Murder Drones Fight Til I'm Good Enough The Living Tombstone", cover: "" },
  { id: "tlt-epoch", title: "Epoch (Savlonic Remix)", artist: "The Living Tombstone", genre: "Collabs & Remixes", year: 2015, ytQuery: "Savlonic Epoch The Living Tombstone Remix", cover: "" },
  { id: "tlt-dieinafire", title: "Die in a Fire (feat. Elsie Lovelace)", artist: "The Living Tombstone", genre: "Collabs & Remixes", year: 2022, ytQuery: "The Living Tombstone Die in a Fire", cover: "" },
];

export const allTltTracks: CatalogEntry[] = [...tltGaming, ...tltOriginals, ...tltCollabs];

export const TLT_SUB_GROUPS = [
  { label: "🎮 FNAF & Gaming", entries: tltGaming },
  { label: "🎤 Originals", entries: tltOriginals },
  { label: "🤝 Collabs & Remixes", entries: tltCollabs },
];

/* ─────────────── Fall Out Boy ─────────────── */
export const fallOutBoyTracks: CatalogEntry[] = [
  { id: "fob-grandtheftautumn", title: "Grand Theft Autumn/Where Is Your Boy", artist: "Fall Out Boy", genre: "Pop Punk", year: 2003, ytQuery: "Fall Out Boy Grand Theft Autumn Where Is Your Boy", cover: "" },
  { id: "fob-saturday", title: "Saturday", artist: "Fall Out Boy", genre: "Pop Punk", year: 2003, ytQuery: "Fall Out Boy Saturday", cover: "" },
  { id: "fob-deadonarrival", title: "Dead on Arrival", artist: "Fall Out Boy", genre: "Pop Punk", year: 2003, ytQuery: "Fall Out Boy Dead on Arrival", cover: "" },
  { id: "fob-carpaltunnel", title: "The Carpal Tunnel of Dying", artist: "Fall Out Boy", genre: "Pop Punk", year: 2005, ytQuery: "Fall Out Boy The Carpal Tunnel of Dying", cover: "" },
  { id: "fob-sugarwerengoindown", title: "Sugar We\'re Goin Down", artist: "Fall Out Boy", genre: "Pop Punk", year: 2005, ytQuery: "Fall Out Boy Sugar We're Goin Down", cover: "" },
  { id: "fob-dancedance", title: "Dance Dance", artist: "Fall Out Boy", genre: "Pop Punk", year: 2005, ytQuery: "Fall Out Boy Dance Dance", cover: "" },
  { id: "fob-thnksfrthmmrs", title: "Thnks fr th Mmrs", artist: "Fall Out Boy", genre: "Alt Rock", year: 2007, ytQuery: "Fall Out Boy Thnks fr th Mmrs", cover: "" },
  { id: "fob-armsrace", title: "This Ain\'t a Scene It\'s an Arms Race", artist: "Fall Out Boy", genre: "Alt Rock", year: 2007, ytQuery: "Fall Out Boy This Ain't a Scene It's an Arms Race", cover: "" },
  { id: "fob-idontcare", title: "I Don\'t Care", artist: "Fall Out Boy", genre: "Alt Rock", year: 2008, ytQuery: "Fall Out Boy I Don't Care", cover: "" },
  { id: "fob-americassuitehearts", title: "America\'s Suitehearts", artist: "Fall Out Boy", genre: "Alt Rock", year: 2008, ytQuery: "Fall Out Boy Americas Suitehearts", cover: "" },
  { id: "fob-phoenix", title: "The Phoenix", artist: "Fall Out Boy", genre: "Modern Rock", year: 2013, ytQuery: "Fall Out Boy The Phoenix", cover: "" },
  { id: "fob-lightemup", title: "My Songs Know What You Did in the Dark (Light Em Up)", artist: "Fall Out Boy", genre: "Modern Rock", year: 2013, ytQuery: "Fall Out Boy My Songs Know What You Did in the Dark Light Em Up", cover: "" },
  { id: "fob-youngvolcanoes", title: "Young Volcanoes", artist: "Fall Out Boy", genre: "Modern Rock", year: 2013, ytQuery: "Fall Out Boy Young Volcanoes", cover: "" },
  { id: "fob-immortals", title: "Immortals", artist: "Fall Out Boy", genre: "Soundtrack", year: 2014, ytQuery: "Fall Out Boy Immortals Big Hero 6", cover: "" },
  { id: "fob-centuries", title: "Centuries", artist: "Fall Out Boy", genre: "Modern Rock", year: 2015, ytQuery: "Fall Out Boy Centuries", cover: "" },
  { id: "fob-umathurman", title: "Uma Thurman", artist: "Fall Out Boy", genre: "Modern Rock", year: 2015, ytQuery: "Fall Out Boy Uma Thurman", cover: "" },
  { id: "fob-irresistible", title: "Irresistible", artist: "Fall Out Boy", genre: "Modern Rock", year: 2016, ytQuery: "Fall Out Boy Irresistible", cover: "" },
  { id: "fob-holdmetightordonot", title: "Hold Me Tight or Don\'t", artist: "Fall Out Boy", genre: "Modern Rock", year: 2018, ytQuery: "Fall Out Boy Hold Me Tight or Don't", cover: "" },
  { id: "fob-whatacatch", title: "What a Catch, Donnie", artist: "Fall Out Boy", genre: "Alt Rock", year: 2008, ytQuery: "Fall Out Boy What a Catch Donnie", cover: "" },
  { id: "fob-20dollarnosebleed", title: "20 Dollar Nose Bleed", artist: "Fall Out Boy", genre: "Alt Rock", year: 2008, ytQuery: "Fall Out Boy 20 Dollar Nose Bleed", cover: "" },
  { id: "fob-lovefromtheotherside", title: "Love from the Other Side", artist: "Fall Out Boy", genre: "Modern Rock", year: 2023, ytQuery: "Fall Out Boy Love from the Other Side", cover: "" },
  { id: "fob-heartbreakfeelsogood", title: "Heartbreak Feels So Good", artist: "Fall Out Boy", genre: "Modern Rock", year: 2023, ytQuery: "Fall Out Boy Heartbreak Feels So Good", cover: "" },
  { id: "fob-somuchforstardust", title: "So Much (For) Stardust", artist: "Fall Out Boy", genre: "Modern Rock", year: 2023, ytQuery: "Fall Out Boy So Much For Stardust", cover: "" },
];

/* ─────────────── Imagine Dragons ─────────────── */
export const imagineDragonsTracks: CatalogEntry[] = [
  { id: "idg-itstime", title: "It\'s Time", artist: "Imagine Dragons", genre: "Arena Rock", year: 2012, ytQuery: "Imagine Dragons Its Time", cover: "" },
  { id: "idg-radioactive", title: "Radioactive", artist: "Imagine Dragons", genre: "Arena Rock", year: 2012, ytQuery: "Imagine Dragons Radioactive", cover: "" },
  { id: "idg-demons", title: "Demons", artist: "Imagine Dragons", genre: "Arena Rock", year: 2012, ytQuery: "Imagine Dragons Demons", cover: "" },
  { id: "idg-ontopoftheworld", title: "On Top of the World", artist: "Imagine Dragons", genre: "Arena Rock", year: 2012, ytQuery: "Imagine Dragons On Top of the World", cover: "" },
  { id: "idg-amsterdam", title: "Amsterdam", artist: "Imagine Dragons", genre: "Arena Rock", year: 2012, ytQuery: "Imagine Dragons Amsterdam", cover: "" },
  { id: "idg-ibetmylife", title: "I Bet My Life", artist: "Imagine Dragons", genre: "Alt Pop", year: 2014, ytQuery: "Imagine Dragons I Bet My Life", cover: "" },
  { id: "idg-shots", title: "Shots", artist: "Imagine Dragons", genre: "Alt Pop", year: 2014, ytQuery: "Imagine Dragons Shots", cover: "" },
  { id: "idg-warriors", title: "Warriors", artist: "Imagine Dragons", genre: "Soundtrack", year: 2014, ytQuery: "Imagine Dragons Warriors League of Legends", cover: "" },
  { id: "idg-gold", title: "Gold", artist: "Imagine Dragons", genre: "Alt Pop", year: 2014, ytQuery: "Imagine Dragons Gold", cover: "" },
  { id: "idg-believer", title: "Believer", artist: "Imagine Dragons", genre: "Alt Pop", year: 2017, ytQuery: "Imagine Dragons Believer", cover: "" },
  { id: "idg-thunder", title: "Thunder", artist: "Imagine Dragons", genre: "Alt Pop", year: 2017, ytQuery: "Imagine Dragons Thunder", cover: "" },
  { id: "idg-whateverittakes", title: "Whatever It Takes", artist: "Imagine Dragons", genre: "Alt Pop", year: 2017, ytQuery: "Imagine Dragons Whatever It Takes", cover: "" },
  { id: "idg-walkingthewire", title: "Walking the Wire", artist: "Imagine Dragons", genre: "Alt Pop", year: 2017, ytQuery: "Imagine Dragons Walking the Wire", cover: "" },
  { id: "idg-nexttome", title: "Next to Me", artist: "Imagine Dragons", genre: "Alt Pop", year: 2018, ytQuery: "Imagine Dragons Next to Me", cover: "" },
  { id: "idg-natural", title: "Natural", artist: "Imagine Dragons", genre: "Alt Pop", year: 2018, ytQuery: "Imagine Dragons Natural", cover: "" },
  { id: "idg-badliar", title: "Bad Liar", artist: "Imagine Dragons", genre: "Alt Pop", year: 2018, ytQuery: "Imagine Dragons Bad Liar", cover: "" },
  { id: "idg-zero", title: "Zero", artist: "Imagine Dragons", genre: "Soundtrack", year: 2018, ytQuery: "Imagine Dragons Zero Ralph Breaks the Internet", cover: "" },
  { id: "idg-birds", title: "Birds", artist: "Imagine Dragons", genre: "Alt Pop", year: 2019, ytQuery: "Imagine Dragons Birds", cover: "" },
  { id: "idg-wrecked", title: "Wrecked", artist: "Imagine Dragons", genre: "Modern Rock", year: 2021, ytQuery: "Imagine Dragons Wrecked", cover: "" },
  { id: "idg-enemy", title: "Enemy", artist: "Imagine Dragons", genre: "Soundtrack", year: 2021, ytQuery: "Imagine Dragons Enemy Arcane", cover: "" },
  { id: "idg-bones", title: "Bones", artist: "Imagine Dragons", genre: "Modern Rock", year: 2022, ytQuery: "Imagine Dragons Bones", cover: "" },
  { id: "idg-sharks", title: "Sharks", artist: "Imagine Dragons", genre: "Modern Rock", year: 2022, ytQuery: "Imagine Dragons Sharks", cover: "" },
  { id: "idg-symphony", title: "Symphony", artist: "Imagine Dragons", genre: "Modern Rock", year: 2024, ytQuery: "Imagine Dragons Symphony", cover: "" },
  { id: "idg-takemetothbeach", title: "Take Me to the Beach", artist: "Imagine Dragons", genre: "Modern Rock", year: 2024, ytQuery: "Imagine Dragons Take Me to the Beach", cover: "" },
];

/* ─────────────── Skillet ─────────────── */
export const skilletTracks: CatalogEntry[] = [
  { id: "skl-rebirthing", title: "Rebirthing", artist: "Skillet", genre: "Hard Rock", year: 2006, ytQuery: "Skillet Rebirthing", cover: "" },
  { id: "skl-whispersinthedark", title: "Whispers in the Dark", artist: "Skillet", genre: "Hard Rock", year: 2006, ytQuery: "Skillet Whispers in the Dark", cover: "" },
  { id: "skl-thelastnight", title: "The Last Night", artist: "Skillet", genre: "Hard Rock", year: 2006, ytQuery: "Skillet The Last Night", cover: "" },
  { id: "skl-comatose", title: "Comatose", artist: "Skillet", genre: "Hard Rock", year: 2006, ytQuery: "Skillet Comatose", cover: "" },
  { id: "skl-monster", title: "Monster", artist: "Skillet", genre: "Hard Rock", year: 2009, ytQuery: "Skillet Monster", cover: "" },
  { id: "skl-hero", title: "Hero", artist: "Skillet", genre: "Hard Rock", year: 2009, ytQuery: "Skillet Hero official", cover: "" },
  { id: "skl-awakeandalive", title: "Awake and Alive", artist: "Skillet", genre: "Hard Rock", year: 2009, ytQuery: "Skillet Awake and Alive", cover: "" },
  { id: "skl-forsaken", title: "Forsaken", artist: "Skillet", genre: "Hard Rock", year: 2009, ytQuery: "Skillet Forsaken", cover: "" },
  { id: "skl-sickofit", title: "Sick of It", artist: "Skillet", genre: "Christian Rock", year: 2013, ytQuery: "Skillet Sick of It", cover: "" },
  { id: "skl-americannoise", title: "American Noise", artist: "Skillet", genre: "Christian Rock", year: 2013, ytQuery: "Skillet American Noise", cover: "" },
  { id: "skl-notgonnadie", title: "Not Gonna Die", artist: "Skillet", genre: "Christian Rock", year: 2013, ytQuery: "Skillet Not Gonna Die", cover: "" },
  { id: "skl-stars", title: "Stars", artist: "Skillet", genre: "Christian Rock", year: 2013, ytQuery: "Skillet Stars", cover: "" },
  { id: "skl-feelinvincible", title: "Feel Invincible", artist: "Skillet", genre: "Christian Rock", year: 2016, ytQuery: "Skillet Feel Invincible", cover: "" },
  { id: "skl-legendary", title: "Legendary", artist: "Skillet", genre: "Christian Rock", year: 2016, ytQuery: "Skillet Legendary official", cover: "" },
  { id: "skl-saveme", title: "Save Me", artist: "Skillet", genre: "Christian Rock", year: 2016, ytQuery: "Skillet Save Me", cover: "" },
  { id: "skl-backfromthedead", title: "Back from the Dead", artist: "Skillet", genre: "Christian Rock", year: 2016, ytQuery: "Skillet Back from the Dead official", cover: "" },
  { id: "skl-psychoinmyhead", title: "Psycho in My Head", artist: "Skillet", genre: "Hard Rock", year: 2022, ytQuery: "Skillet Psycho in My Head", cover: "" },
  { id: "skl-dominion", title: "Dominion", artist: "Skillet", genre: "Hard Rock", year: 2022, ytQuery: "Skillet Dominion", cover: "" },
];

/** Every Geometry Dash track, flat (search + play-all). */
export const allGDTracks: CatalogEntry[] = [
  ...gdMainLevels,
  ...gdMeltdownSubzero,
  ...gdClassicDemons,
  ...gdExtremeDemons,
  ...gdDemonListExtras,
];

/** Kevin MacLeod shelf = verified works + extras. */
export const kevinMacleodTracks: CatalogEntry[] = [...kevinMacleodBase, ...kevinMacleodExtras];

/** Labelled sub-groups so shelves can organise the OST by theme/difficulty. */
export const GD_SUB_GROUPS = [
  { label: "🟢 Main Levels", entries: gdMainLevels },
  { label: "🔵 Meltdown & Subzero", entries: gdMeltdownSubzero },
  { label: "🔴 Classic Demons", entries: gdClassicDemons },
  { label: "💀 Extreme Demons", entries: [...gdExtremeDemons, ...gdDemonListExtras] },
];

/* ─────────────── Phonk / drift ─────────────── */
export const phonkTracks: CatalogEntry[] = [
  { id: "phk-brutalmind", title: "Brutal Mind", artist: "Tevvez", genre: "Phonk", year: 2022, ytQuery: "Tevvez Brutal Mind", cover: "" },
  { id: "phk-murder", title: "Murder In My Mind", artist: "Kordhell", genre: "Phonk", year: 2022, ytQuery: "Kordhell Murder In My Mind", cover: "" },
  { id: "phk-liveanother", title: "Live Another Day", artist: "Kordhell", genre: "Phonk", year: 2022, ytQuery: "Kordhell Live Another Day", cover: "" },
  { id: "phk-override", title: "Override", artist: "KSLV Noh", genre: "Phonk", year: 2021, ytQuery: "KSLV Noh Override", cover: "" },
  { id: "phk-disaster", title: "Disaster", artist: "KSLV Noh", genre: "Phonk", year: 2021, ytQuery: "KSLV Noh Disaster", cover: "" },
  { id: "phk-neonblade", title: "Neon Blade", artist: "MoonDeity", genre: "Phonk", year: 2022, ytQuery: "MoonDeity Neon Blade", cover: "" },
  { id: "phk-gigachad", title: "Gigachad Theme", artist: "Phonk", genre: "Phonk", year: 2022, ytQuery: "Gigachad Theme phonk", cover: "" },
  { id: "phk-closeeyes", title: "Close Eyes", artist: "DVRST", genre: "Phonk", year: 2021, ytQuery: "DVRST Close Eyes", cover: "" },
  { id: "phk-metamorphosis", title: "Metamorphosis", artist: "Interworld", genre: "Phonk", year: 2022, ytQuery: "Interworld Metamorphosis", cover: "" },
  { id: "phk-whynot", title: "Why Not", artist: "Ghostface Playa", genre: "Phonk", year: 2022, ytQuery: "Ghostface Playa Why Not", cover: "" },
  { id: "phk-raze", title: "Raze", artist: "Hensonn", genre: "Phonk", year: 2022, ytQuery: "Hensonn Raze", cover: "" },
  { id: "phk-sahara", title: "Sahara", artist: "Hensonn", genre: "Phonk", year: 2022, ytQuery: "Hensonn Sahara", cover: "" },
];

/* ─────────────── Anime lofi & OST ─────────────── */
export const animeLofiTracks: CatalogEntry[] = [
  { id: "ani-spirited", title: "Spirited Away Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Spirited Away Lofi Remix", cover: "" },
  { id: "ani-naruto", title: "Naruto Sad Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Naruto Sad Lofi Remix", cover: "" },
  { id: "ani-dragonball", title: "Dragon Ball Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Dragon Ball Lofi Remix", cover: "" },
  { id: "ani-attackontitan", title: "Attack on Titan Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Attack on Titan Lofi Remix", cover: "" },
  { id: "ani-deathnote", title: "Death Note Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Death Note Lofi Remix", cover: "" },
  { id: "ani-yourname", title: "Your Name Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2021, ytQuery: "Your Name Sparkle Lofi Remix", cover: "" },
  { id: "ani-demonlofi", title: "Demon Slayer Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2022, ytQuery: "Demon Slayer Lofi Remix", cover: "" },
  { id: "ani-onepiece", title: "One Piece Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2022, ytQuery: "One Piece Lofi Remix", cover: "" },
  { id: "ani-jujutsu", title: "Jujutsu Kaisen Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2022, ytQuery: "Jujutsu Kaisen Lofi Remix", cover: "" },
  { id: "ani-chainsaw", title: "Chainsaw Man Lofi", artist: "Lofi Anime", genre: "Lofi / Anime", year: 2023, ytQuery: "Chainsaw Man Lofi Remix", cover: "" },
];

/* ─────────────── Sections ─────────────── */
export const ALL_SECTIONS: CatalogSection[] = [
  { id: "ncs-famous", strictArtist: true, artistAliases: ["ncs", "nocopyrightsounds"], title: "NCS Famous Hits", subtitle: `${ncsFamousTracks.length} tracks • NoCopyrightSounds`, icon: "⚡", gradient: "linear-gradient(135deg,#00d4ff,#00ff88)", copyright: "FREE — NoCopyrightSounds", entries: ncsFamousTracks },
  { id: "neffex", strictArtist: true, title: "NEFFEX", subtitle: `${neffexTracks.length} tracks • Hip Hop / Rock`, icon: "🔥", gradient: "linear-gradient(135deg,#ff2e97,#ffd700)", copyright: "FREE — NEFFEX", entries: neffexTracks },
  { id: "phonk", title: "Phonk / Drift", subtitle: `${phonkTracks.length} tracks • Phonk & Drift`, icon: "💀", gradient: "linear-gradient(135deg,#ff2e97,#7b2ff7)", copyright: "No Copyright", entries: phonkTracks },
  { id: "anime-lofi", title: "Anime Lofi", subtitle: `${animeLofiTracks.length} tracks • Lofi Remixes`, icon: "🌸", gradient: "linear-gradient(135deg,#ff69b4,#7b2ff7)", copyright: "No Copyright", entries: animeLofiTracks },
  { id: "kevin-macleod", strictArtist: true, artistAliases: ["incompetech", "kevin macleod"], title: "Kevin MacLeod", subtitle: `${kevinMacleodTracks.length} tracks • Royalty-Free`, icon: "🎭", gradient: "linear-gradient(135deg,#ffd700,#ff6b35)", copyright: "CC BY — incompetech", entries: kevinMacleodTracks },
  { id: "thefatrat", strictArtist: true, title: "TheFatRat", subtitle: `${theFatRatTracks.length} tracks • Chart Your Course 🚀`, icon: "🎮", gradient: "linear-gradient(135deg,#7b2ff7,#00d4ff)", copyright: "FREE — TheFatRat / NoCopyright", entries: theFatRatTracks },
  { id: "aw-mm", strictArtist: true, title: "Alan Walker & Marshmello", subtitle: `${alanWalkerMarshmelloTracks.length} tracks • Chart Your Course 🚀`, icon: "🎧", gradient: "linear-gradient(135deg,#00d4ff,#ff2e97)", copyright: "Chart Your Course collection", entries: alanWalkerMarshmelloTracks },
  {
    id: "undertale",
    strictArtist: true,
    artistAliases: ["undertale", "toby fox"],
    title: "Undertale — Toby Fox",
    subtitle: `${allUndertaleTracks.length} tracks • Official OST, organised by area`,
    icon: "🦴",
    gradient: "linear-gradient(135deg,#ffd700,#7b2ff7)",
    copyright: "FREE — Toby Fox / Undertale OST",
    subGroups: UNDERTALE_SUB_GROUPS.map((g) => ({ label: g.label, entryIds: g.entries.map((e) => e.id) })),
    entries: allUndertaleTracks,
  },
  {
    id: "living-tombstone",
    strictArtist: true,
    artistAliases: ["living tombstone", "tlt"],
    title: "The Living Tombstone",
    subtitle: `${allTltTracks.length} tracks • FNAF songs, originals & collabs`,
    icon: "👾",
    gradient: "linear-gradient(135deg,#ff2e97,#0d1b2a)",
    copyright: "FREE — The Living Tombstone",
    subGroups: TLT_SUB_GROUPS.map((g) => ({ label: g.label, entryIds: g.entries.map((e) => e.id) })),
    entries: allTltTracks,
  },
  { id: "fall-out-boy", strictArtist: true, title: "Fall Out Boy", subtitle: `${fallOutBoyTracks.length} tracks • Pop Punk → Modern Rock`, icon: "🎸", gradient: "linear-gradient(135deg,#111827,#ff2e97)", copyright: "Artist collection", entries: fallOutBoyTracks },
  { id: "imagine-dragons", strictArtist: true, title: "Imagine Dragons", subtitle: `${imagineDragonsTracks.length} tracks • Arena Rock & Alt Pop`, icon: "🐉", gradient: "linear-gradient(135deg,#0d1b2a,#ffd700)", copyright: "Artist collection", entries: imagineDragonsTracks },
  { id: "skillet", strictArtist: true, title: "Skillet", subtitle: `${skilletTracks.length} tracks • Hard Rock`, icon: "⚡", gradient: "linear-gradient(135deg,#7f1d1d,#f97316)", copyright: "Artist collection", entries: skilletTracks },
  {
    id: "geometry-dash",
    artistAliases: ["geometry dash"],
    title: "Geometry Dash OST",
    subtitle: `${allGDTracks.length} tracks • Main + Meltdown/Subzero + Demon List`,
    icon: "🟦",
    gradient: "linear-gradient(135deg,#00ff88,#00d4ff)",
    copyright: "FREE — Creative Commons",
    subGroups: GD_SUB_GROUPS.map((g) => ({ label: g.label, entryIds: g.entries.map((e) => e.id) })),
    entries: allGDTracks,
  },
];

export function getSection(id: string) {
  const canonical = SECTION_ALIASES[id] || id;
  return ALL_SECTIONS.find((s) => s.id === canonical) || ALL_SECTIONS.find((s) => s.id === id) || null;
}

export function getEntry(id: string): { section: CatalogSection; entry: CatalogEntry } | null {
  for (const section of ALL_SECTIONS) {
    const entry = section.entries.find((e) => e.id === id);
    if (entry) return { section, entry };
  }
  return null;
}

export function getAllTracks(): CatalogEntry[] {
  return ALL_SECTIONS.flatMap((s) => s.entries);
}

/** Instant local match used by universal search (no upstream calls). */
export function searchLocalTracks(query: string, limit = 6): CatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  // every token must appear somewhere in title/artist/genre, so
  // "Fade Alan Walker", "Alan Walker Fade" and "fade" all match
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  const scored = getAllTracks()
    .map((t) => {
      const haystack = `${t.title} ${t.artist} ${t.genre}`.toLowerCase();
      const hits = tokens.filter((tok) => haystack.includes(tok)).length;
      const exactTitle = t.title.toLowerCase() === q || haystack.startsWith(q) ? 2 : 0;
      return { entry: t, score: hits === tokens.length ? hits + exactTitle : hits === tokens.length - 1 && tokens.length > 2 ? 1 : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((r) => r.entry);
}
