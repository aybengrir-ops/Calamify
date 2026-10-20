/** Static cosmic catalog: genres, moods, curated playlists, testimonials. */

export interface Genre {
  name: string;
  slug: string;
  icon: string;
  description: string;
  query: string;
  audiusGenre?: string;
  from: string; // tailwind-friendly hex
  to: string;
}

export const GENRES: Genre[] = [
  { name: "Pop", slug: "pop", icon: "🪐", description: "Gravity-defying hooks and chart supernovas", query: "pop hits 2026", audiusGenre: "Pop", from: "#ff2e97", to: "#7b2ff7" },
  { name: "Rock", slug: "rock", icon: "🌋", description: "Craters of distortion and arena-sized riffs", query: "classic rock anthems", audiusGenre: "Rock", from: "#ff5f6d", to: "#7b2ff7" },
  { name: "Hip Hop", slug: "hip-hop", icon: "🛸", description: "Boom-bap rockets and lyrical launches", query: "hip hop rap classics", audiusGenre: "Hip-Hop/Rap", from: "#ffd700", to: "#ff2e97" },
  { name: "Rap", slug: "rap", icon: "☄️", description: "Rapid-fire verses at escape velocity", query: "rap fire verses", audiusGenre: "Hip-Hop/Rap", from: "#00d4ff", to: "#7b2ff7" },
  { name: "R&B", slug: "rnb", icon: "🌙", description: "Silk vocals under a crescent moon", query: "rnb soul slow jams", audiusGenre: "R&B/Soul", from: "#a78bfa", to: "#ff2e97" },
  { name: "Soul", slug: "soul", icon: "✨", description: "Deep feeling from the heart of the nebula", query: "soul music classics", audiusGenre: "R&B/Soul", from: "#ffb347", to: "#ff2e97" },
  { name: "Jazz", slug: "jazz", icon: "🎷", description: "Improvised constellations of sound", query: "smooth jazz instrumental", audiusGenre: "Jazz", from: "#00d4ff", to: "#0d1b2a" },
  { name: "Classical", slug: "classical", icon: "🎻", description: "Timeless compositions older than starlight", query: "classical music orchestra", audiusGenre: "Classical", from: "#e0e7ff", to: "#7b2ff7" },
  { name: "Electronic", slug: "electronic", icon: "⚡", description: "Synthetic suns and voltage skies", query: "electronic music mix", audiusGenre: "Electronic", from: "#00d4ff", to: "#7b2ff7" },
  { name: "EDM", slug: "edm", icon: "🌌", description: "Festival energy from the edge of the galaxy", query: "edm festival drops", audiusGenre: "Electronic", from: "#ff2e97", to: "#00d4ff" },
  { name: "Country", slug: "country", icon: "🤠", description: "Dusty roads and open-sky storytelling", query: "country music hits", audiusGenre: "Country", from: "#ffd700", to: "#ff5f6d" },
  { name: "Reggae", slug: "reggae", icon: "🌴", description: "One love, one rhythm, one orbit", query: "reggae roots classics", audiusGenre: "Reggae", from: "#22c55e", to: "#ffd700" },
  { name: "Blues", slug: "blues", icon: "🎸", description: "Twelve bars of midnight gravity", query: "blues guitar classics", audiusGenre: "Blues", from: "#3b82f6", to: "#0d1b2a" },
  { name: "Metal", slug: "metal", icon: "🖤", description: "Black holes with double-kick engines", query: "heavy metal anthems", audiusGenre: "Metal", from: "#6b7280", to: "#7b2ff7" },
  { name: "Punk", slug: "punk", icon: "📌", description: "Three chords and total liftoff", query: "punk rock classics", audiusGenre: "Punk", from: "#ff5f6d", to: "#ffd700" },
  { name: "Folk", slug: "folk", icon: "🍂", description: "Acoustic tales from small blue planets", query: "folk acoustic songs", audiusGenre: "Folk", from: "#d9a066", to: "#7b2ff7" },
  { name: "Acoustic", slug: "acoustic", icon: "🪕", description: "Unplugged, unhurried, unfiltered", query: "acoustic covers unplugged", from: "#fbbf24", to: "#ff2e97" },
  { name: "Latin", slug: "latin", icon: "💃", description: "Heat, rhythm and solar flares", query: "latin hits reggaeton", audiusGenre: "Latin", from: "#ff2e97", to: "#ffd700" },
  { name: "K-Pop", slug: "k-pop", icon: "🇰🇷", description: "Hyper-color idols from the east galaxy", query: "kpop hits", audiusGenre: "K-Pop", from: "#ff6fd8", to: "#3813c2" },
  { name: "Afrobeats", slug: "afrobeats", icon: "🥁", description: "Continental grooves with cosmic pulse", query: "afrobeats hits", audiusGenre: "Afrobeats", from: "#f97316", to: "#22c55e" },
  { name: "Indie", slug: "indie", icon: "🌠", description: "Bedroom telescopes pointed at the charts", query: "indie music hits", audiusGenre: "Alternative", from: "#a78bfa", to: "#00d4ff" },
  { name: "Alternative", slug: "alternative", icon: "🌀", description: "Left-of-centre orbits and strange beauty", query: "alternative rock hits", audiusGenre: "Alternative", from: "#22d3ee", to: "#7b2ff7" },
  { name: "Gospel", slug: "gospel", icon: "🙌", description: "Choirs loud enough to move moons", query: "gospel music praise", audiusGenre: "Gospel", from: "#ffd700", to: "#a78bfa" },
  { name: "Funk", slug: "funk", icon: "🕺", description: "Basslines with their own gravitational pull", query: "funk music classics", from: "#f59e0b", to: "#ff2e97" },
  { name: "Disco", slug: "disco", icon: "🪩", description: "Mirror-ball meteor showers", query: "disco classics 70s", from: "#ff2e97", to: "#ffd700" },
  { name: "Lo-Fi", slug: "lo-fi", icon: "📼", description: "Dusty tape hiss for quiet orbits", query: "lofi hip hop beats to study", audiusGenre: "Lo-Fi", from: "#a78bfa", to: "#0d1b2a" },
  { name: "Chill", slug: "chill", icon: "🧊", description: "Zero-gravity sound baths", query: "chill vibes playlist", audiusGenre: "Chill", from: "#00d4ff", to: "#a78bfa" },
  { name: "Ambient", slug: "ambient", icon: "🌫️", description: "Deep-field drones and starlight pads", query: "ambient space music", audiusGenre: "Ambient", from: "#312e81", to: "#0d1b2a" },
  { name: "Trap", slug: "trap", icon: "🕳️", description: "Hi-hat meteor storms and 808 craters", query: "trap beats mix", audiusGenre: "Trap", from: "#7b2ff7", to: "#ff2e97" },
  { name: "Dubstep", slug: "dubstep", icon: "🌪️", description: "Wobbling wormholes of bass", query: "dubstep drops", audiusGenre: "Dubstep", from: "#22c55e", to: "#00d4ff" },
  { name: "House", slug: "house", icon: "🏠", description: "Four-to-the-floor launch sequences", query: "deep house mix", audiusGenre: "House", from: "#00d4ff", to: "#ff2e97" },
  { name: "Techno", slug: "techno", icon: "🤖", description: "Machine precision in dark orbit", query: "techno mix berlin", audiusGenre: "Techno", from: "#64748b", to: "#7b2ff7" },
  { name: "Drum & Bass", slug: "drum-and-bass", icon: "🥁", description: "Breakbeats at 174 light-speed", query: "drum and bass liquid", audiusGenre: "Drum & Bass", from: "#facc15", to: "#22c55e" },
  { name: "Ska", slug: "ska", icon: "🎺", description: "Upstrokes and checkered comets", query: "ska classics", from: "#111827", to: "#f9fafb" },
  { name: "Grunge", slug: "grunge", icon: "🌧️", description: "Flannel-clad asteroid belts", query: "grunge 90s classics", from: "#4b5563", to: "#0d1b2a" },
  { name: "Opera", slug: "opera", icon: "🎭", description: "Arias that echo across vacuum", query: "opera famous arias", from: "#7f1d1d", to: "#ffd700" },
  { name: "Reggaeton", slug: "reggaeton", icon: "🔥", description: "Dembow rhythm, tropical supernova", query: "reggaeton hits", audiusGenre: "Latin", from: "#f97316", to: "#ff2e97" },
  { name: "Dancehall", slug: "dancehall", icon: "🌊", description: "Caribbean signal, cosmic reception", query: "dancehall hits", from: "#22c55e", to: "#ffd700" },
  { name: "Synthwave", slug: "synthwave", icon: "🌇", description: "Neon grid horizons and chrome sunsets", query: "synthwave retrowave mix", audiusGenre: "Synthwave", from: "#ff2e97", to: "#7b2ff7" },
  { name: "Phonk", slug: "phonk", icon: "💀", description: "Cowbell drift through the void", query: "phonk drift mix", audiusGenre: "Phonk", from: "#7f1d1d", to: "#111827" },
  { name: "Bossa Nova", slug: "bossa-nova", icon: "🏖️", description: "Whispered samba from a warm planet", query: "bossa nova classics", audiusGenre: "Jazz", from: "#fca5a5", to: "#00d4ff" },
  { name: "World Music", slug: "world", icon: "🌍", description: "Every continent, one frequency", query: "world music global beats", from: "#16a34a", to: "#00d4ff" },
  { name: "Soundtrack", slug: "soundtrack", icon: "🎬", description: "Scores for your personal space opera", query: "epic film soundtrack", audiusGenre: "Soundtrack", from: "#1e3a8a", to: "#a78bfa" },
  { name: "Bollywood", slug: "bollywood", icon: "🎇", description: "Technicolor romance at warp speed", query: "bollywood hits songs", from: "#f472b6", to: "#facc15" },
  { name: "J-Pop", slug: "j-pop", icon: "🗾", description: "Tokyo neon and city-pop comets", query: "jpop city pop hits", audiusGenre: "J-Pop", from: "#f472b6", to: "#38bdf8" },
  { name: "Arabic", slug: "arabic", icon: "🕌", description: "Desert scales under endless stars", query: "arabic music hits", from: "#fbbf24", to: "#7c2d12" },
  { name: "Psychedelic", slug: "psychedelic", icon: "🍄", description: "Kaleidoscopic journeys beyond the veil", query: "psychedelic rock mix", from: "#a21caf", to: "#22d3ee" },
];

export interface Mood {
  name: string;
  icon: string;
  query: string;
  from: string;
  to: string;
}

export const MOODS: Mood[] = [
  { name: "Relaxing", icon: "🫧", query: "relaxing chill music", from: "#00d4ff", to: "#a78bfa" },
  { name: "Workout", icon: "🏋️", query: "workout gym high energy", from: "#ff2e97", to: "#ffd700" },
  { name: "Study", icon: "📚", query: "study focus lofi", from: "#22c55e", to: "#00d4ff" },
  { name: "Party", icon: "🎉", query: "party dance hits", from: "#7b2ff7", to: "#ff2e97" },
  { name: "Sad", icon: "🌧️", query: "sad emotional songs", from: "#3b82f6", to: "#0d1b2a" },
  { name: "Driving", icon: "🚗", query: "late night drive synthwave", from: "#f97316", to: "#7b2ff7" },
  { name: "Sleep", icon: "😴", query: "sleep ambient deep space", from: "#312e81", to: "#0a0a1a" },
  { name: "Cooking", icon: "🍳", query: "cooking jazz kitchen vibes", from: "#facc15", to: "#f97316" },
];

export interface CuratedPlaylist {
  slug: string;
  name: string;
  description: string;
  query: string;
  creator: string;
  from: string;
  to: string;
  icon: string;
}

export const FEATURED_PLAYLISTS: CuratedPlaylist[] = [
  { slug: "midnight-nebula-vibes", name: "Midnight Nebula Vibes", description: "Slow-burning atmospherics for the small hours", query: "midnight nebula ambient chill", creator: "Calamify Cosmic", from: "#7b2ff7", to: "#0d1b2a", icon: "🌌" },
  { slug: "solar-chill", name: "Solar Chill", description: "Sun-warmed downtempo and golden hour grooves", query: "solar chill downtempo", creator: "Calamify Cosmic", from: "#ffd700", to: "#ff2e97", icon: "☀️" },
  { slug: "black-hole-bass", name: "Black Hole Bass", description: "Dubstep, trap and low-end gravity", query: "black hole bass dubstep trap", creator: "Event Horizon", from: "#111827", to: "#7b2ff7", icon: "🕳️" },
  { slug: "stardust-acoustic", name: "Stardust Acoustic", description: "Unplugged voices and nylon strings", query: "stardust acoustic unplugged", creator: "Nebula Room", from: "#fbbf24", to: "#a78bfa", icon: "✨" },
  { slug: "galactic-beats", name: "Galactic Beats", description: "Hip-hop instrumentals from the outer rim", query: "galactic beats hip hop instrumental", creator: "MC Orion", from: "#00d4ff", to: "#ff2e97", icon: "🛰️" },
  { slug: "orbit-lounge", name: "Orbit Lounge", description: "Jazz, bossa and zero-gravity cocktails", query: "orbit lounge jazz bossa nova", creator: "Luna Club", from: "#22c55e", to: "#00d4ff", icon: "🍸" },
  { slug: "supernova-anthems", name: "Supernova Anthems", description: "Stadium-sized pop and rock explosions", query: "supernova anthems pop rock", creator: "Calamify Cosmic", from: "#ff5f6d", to: "#ffd700", icon: "💥" },
  { slug: "cryosleep", name: "Cryosleep", description: "Ambient drones for deep-space hibernation", query: "cryosleep ambient space sleep", creator: "Deep Field", from: "#312e81", to: "#0a0a1a", icon: "🧊" },
];

export const TESTIMONIALS = [
  { name: "Nova Adeyemi", handle: "@novaorbits", rating: 5, genre: "Afrobeats", quote: "I searched a rare Fela cut at 2am and it played in full three seconds later. Calamify ruined every other app for me." },
  { name: "Mira Solberg", handle: "@mirasounds", rating: 5, genre: "Ambient", quote: "The space theme is not a gimmick – the whole interface feels like floating. Cryosleep playlist has me sleeping through my alarms." },
  { name: "Dev Raman", handle: "@devbeats", rating: 5, genre: "Lo-Fi", quote: "Queue, radio, synced lyrics, offline downloads. It is a full studio deck that lives in my browser." },
  { name: "Chloé Marchand", handle: "@chloecosmos", rating: 4, genre: "Synthwave", quote: "Installed it on my phone straight away. Neon grid gradients plus perfect playback – what more do you want?" },
  { name: "Tomás Rivera", handle: "@tommyrotor", rating: 5, genre: "House", quote: "Radio mode from any track keeps my sets flowing. I have not touched a track selector in weeks." },
  { name: "Aiko Tanaka", handle: "@aikostellar", rating: 5, genre: "J-Pop", quote: "City-pop deep cuts, full albums, no ads, no previews. Calamify understood the assignment." },
];

export const STATS = [
  { icon: "🎵", value: 50_000_000, suffix: "+", label: "Tracks indexed" },
  { icon: "🎧", value: 10_000_000, suffix: "+", label: "Monthly listeners" },
  { icon: "🎤", value: 500_000, suffix: "+", label: "Artists onboard" },
  { icon: "🌍", value: 195, suffix: "", label: "Countries reached" },
];

export const TRENDING_SEARCHES = [
  "Bohemian Rhapsody",
  "Blinding Lights",
  "lofi beats to study to",
  "Shape of You",
  "synthwave night drive",
  "Billie Jean",
  "deep focus ambient",
  "afrobeats 2026",
];

export function genreBySlug(slug: string) {
  return GENRES.find((g) => g.slug === slug) || null;
}

export function playlistBySlug(slug: string) {
  return FEATURED_PLAYLISTS.find((p) => p.slug === slug) || null;
}
