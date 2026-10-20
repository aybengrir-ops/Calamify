import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ *
 * Users & auth
 * ------------------------------------------------------------------ */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  provider: text("provider").notNull().default("email"),
  avatarUrl: text("avatar_url"),
  avatarSeed: text("avatar_seed"),
  bio: text("bio").default(""),
  isPublic: boolean("is_public").notNull().default(true),
  favoriteGenres: jsonb("favorite_genres").$type<string[]>().default([]),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * OAuth account mapping (NextAuth "Account" equivalent) – one row per
 * external identity (Google / GitHub) linked to a local user.
 * ------------------------------------------------------------------ */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // google | github | credentials
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("accounts_provider_account_idx").on(t.provider, t.providerAccountId),
    index("accounts_user_idx").on(t.userId),
  ]
);

/* ------------------------------------------------------------------ *
 * Cached song metadata (a song === a YouTube video)
 * ------------------------------------------------------------------ */
export const songs = pgTable("songs", {
  id: text("id").primaryKey(), // videoId
  title: text("title").notNull(),
  artist: text("artist").notNull().default("Unknown Artist"),
  channelId: text("channel_id"),
  album: text("album"),
  genre: text("genre"),
  duration: integer("duration").notNull().default(0),
  thumbnail: text("thumbnail").notNull().default(""),
  views: text("views").default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Liked songs
 * ------------------------------------------------------------------ */
export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("likes_user_song_idx").on(t.userId, t.songId), index("likes_user_idx").on(t.userId)]
);

/* ------------------------------------------------------------------ *
 * Playlists
 * ------------------------------------------------------------------ */
export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default(""),
    coverUrl: text("cover_url"),
    coverSeed: text("cover_seed"),
    isPublic: boolean("is_public").notNull().default(true),
    isCollaborative: boolean("is_collaborative").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("playlists_user_idx").on(t.userId)]
);

export const playlistSongs = pgTable(
  "playlist_songs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    position: integer("position").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("playlist_songs_playlist_idx").on(t.playlistId), uniqueIndex("playlist_songs_uniq").on(t.playlistId, t.songId)]
);

/* ------------------------------------------------------------------ *
 * Listening history
 * ------------------------------------------------------------------ */
export const history = pgTable(
  "history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    durationListened: integer("duration_listened").notNull().default(0),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("history_user_idx").on(t.userId, t.playedAt)]
);

/* ------------------------------------------------------------------ *
 * Followed artists
 * ------------------------------------------------------------------ */
export const followedArtists = pgTable(
  "followed_artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistName: text("artist_name").notNull(),
    thumbnail: text("thumbnail").default(""),
    listeners: text("listeners").default("0"),
    followedAt: timestamp("followed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("followed_artist_uniq").on(t.userId, t.artistName)]
);

/* ------------------------------------------------------------------ *
 * Saved albums
 * ------------------------------------------------------------------ */
export const savedAlbums = pgTable(
  "saved_albums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    albumKey: text("album_key").notNull(),
    name: text("name").notNull(),
    artist: text("artist").notNull(),
    year: text("year"),
    coverUrl: text("cover_url"),
    query: text("query").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_albums_uniq").on(t.userId, t.albumKey)]
);

/* ------------------------------------------------------------------ *
 * Search history
 * ------------------------------------------------------------------ */
export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    searchedAt: timestamp("searched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("search_history_user_idx").on(t.userId)]
);

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  audioQuality: text("audio_quality").notNull().default("high"), // low | normal | high
  crossfade: integer("crossfade").notNull().default(0), // seconds 0-12
  gapless: boolean("gapless").notNull().default(true),
  normalizeVolume: boolean("normalize_volume").notNull().default(false),
  equalizer: jsonb("equalizer").$type<Record<string, number>>().default({}),
  downloadQuality: text("download_quality").notNull().default("high"),
  language: text("language").notNull().default("en"),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  density: text("density").notNull().default("comfortable"),
  theme: text("theme").notNull().default("space-dark"),
  notifyReleases: boolean("notify_releases").notNull().default(true),
  notifyPlaylists: boolean("notify_playlists").notNull().default(true),
  notifyWeekly: boolean("notify_weekly").notNull().default(true),
  notifyFriends: boolean("notify_friends").notNull().default(false),
  lastfmUsername: text("lastfm_username"),
  scrobble: boolean("scrobble").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body").default(""),
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)]
);

/* ------------------------------------------------------------------ *
 * Downloads (offline cache registry – PWA)
 * ------------------------------------------------------------------ */
export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("downloads_user_song_idx").on(t.userId, t.songId)]
);

/* ------------------------------------------------------------------ *
 * Newsletter subscribers (public, no account needed)
 * ------------------------------------------------------------------ */
export const newsletter = pgTable("newsletter", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
