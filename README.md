# 🌌 Calamify — Your Universe of Music

A **real, functional** music streaming platform. Search any song that exists, press play, and hear it
**full-length** through your speakers — no 30-second previews, no infinite spinners, no CORS errors —
wrapped in a space-themed glassmorphism UI with buttery Lenis/GSAP/Framer Motion animation and full PWA support.

---

## ✨ What works

| Area | Status |
| --- | --- |
| Search any song (Innertube + Audius + NCS + GD, live results < 1s) | ✅ |
| 🎵 NCS (NoCopyrightSounds) library — playlists, genre feeds, channel search | ✅ |
| 🎮 Geometry Dash soundtrack — all 34 official level themes, Creative Commons | ✅ |
| Click play → **full-length** audio, audible immediately | ✅ |
| Audio starts in ~1–6s, 8s watchdog + auto-fallback + auto-skip | ✅ |
| Pause, resume, seek (HTTP Range), skip, volume, mute | ✅ |
| Auto-advance to the next track, repeat one/all, shuffle | ✅ |
| Like/unlike everywhere (optimistic, persisted, guest + account) | ✅ |
| Liked Songs library (sort, filter, search-within, play/shuffle all) | ✅ |
| Playlists: create, edit, duplicate, delete, drag-reorder, share | ✅ |
| Persistent bottom player + full-screen Now Playing + queue drawer | ✅ |
| Web Audio visualizer, synced lyrics (lrclib), Media Session controls | ✅ |
| 47 genres, moods, charts by country, curated mixes, radio | ✅ |
| Artist pages, album pages, follow artists, save albums | ✅ |
| Accounts (bcrypt + JWT cookie), profile, listening stats, streaks | ✅ |
| Recently played history, offline downloads (Cache Storage) | ✅ |
| Settings: quality, crossfade, EQ, notifications, privacy, theme | ✅ |
| PWA: manifest, service worker, installable, offline shell | ✅ |

---

## 🏗️ Architecture

```
Browser  ──audio.src──▶  /api/audio/{songId}      ← same origin, zero CORS
                              │
                              ▼
                     Calamify audio engine (Node runtime)
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   youtubei.js (Innertube)             Audius open API
   search + full-length audio          guaranteed full-length MP3
   sequential chunk download           native HTTP Range support
   → local disk cache → Range serve    → streamed straight through
```

* **`src/lib/innertube.ts`** – one long-lived `Innertube` instance, video search, format
  selection (`audio/mp4` preferred for Safari compatibility), `decipher()`, suggestions, radio.
* **`src/lib/audius.ts`** – discovery host resolution, search, trending, tracks, stream URL resolution.
* **`src/lib/audio-engine.ts`** – the delivery layer: chunked YouTube download into a disk cache,
  Range-aware file serving, upstream proxying, throttling detection, provider fallback, LRU pruning.
* **`src/components/AudioEngine.tsx`** – the single `<audio>` element. 8-second start watchdog,
  stall watchdog, 3-stage failover (re-route → similar full-length track → skip), preloading,
  Media Session metadata, Web Audio analyser.

> **Never** does the browser receive a YouTube/Google/Audius CDN URL. Every byte flows through
> `/api/audio/*`, which also emits `Access-Control-Allow-Origin: *` and `Accept-Ranges: bytes`.

### Failure chain (no infinite loading, ever)

1. Attempt 1 – normal stream through the proxy.
2. 8s without `canplay`, or a stall → **retry with a freshly resolved upstream URL** (`?alt=1`).
3. Still failing → query `/api/radio` for a **similar full-length track** and play it (toast tells you what happened).
4. Still failing → **auto-skip** to the next song in the queue.

Server side, if an upstream refuses to hand over the complete file (some cloud IPs are throttled to
~1 MiB per video), the engine immediately re-routes to a full-length Audius match for the same
title/artist and **memoises that decision**, so seeking stays instant.

---

## 🚀 Setup

```bash
npm install
cp .env.example .env          # DATABASE_URL (+ optional AUTH_SECRET)
npx drizzle-kit migrate       # apply the checked-in schema migrations
node scripts/seed.mjs         # demo account + real, playable library
npm run dev                   # http://localhost:3000
```

**Demo account** (created by the seed): `demo@calamify.space` / `cosmic123`

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | recommended | HMAC secret for session JWTs |
| `CALAMIFY_CACHE_DIR` | optional | Audio cache directory (default `/tmp/calamify-audio`) |
| `GOOGLE_CLIENT_ID` | optional | Enables real OAuth instead of sandbox social identities |

No API keys are needed for playback: `youtubei.js` uses YouTube's internal API and Audius is keyless.
Lyrics come from the free `lrclib.net` API (proxied server-side).

---

## 🧭 Pages

`/` home (hero, genres, trending, playlists, artists, stats, player showcase, app CTA, testimonials) ·
`/explore` · `/trending` · `/playlists` · `/artists` · `/about` · `/search` · `/genre/[slug]` ·
`/mix/[slug]` (curated playlists + moods) · `/artist/[name]` · `/album/[slug]` · `/playlist/[id]` ·
`/library` · `/liked` · `/history` · `/downloads` · `/profile` · `/settings` · 404.

## 🔌 API

| Endpoint | Methods | Description |
| --- | --- | --- |
| `/api/search` | GET | Unified search: Innertube + Audius + NCS + Geometry Dash, suggestions, history |
| `/api/search/all` | GET | Same sources, returned **grouped** (`youtube`, `ncs`, `geometrydash`) |
| `/api/ncs/search` | GET | Search inside the NoCopyrightSounds channel catalogue |
| `/api/ncs/playlists` | GET | Curated NCS playlists + genre feeds + live-discovered playlists |
| `/api/ncs/playlist/[id]` | GET | Tracks of an NCS playlist / genre feed |
| `/api/gd/songs` | GET | Geometry Dash OST (`?q=` search, `?meta=1` level list) |
| `/api/gd/audio/[ngId]` | GET | Newgrounds CDN proxy (Range aware) for a GD track id |
| `/api/ng/genres` | GET | All 32 Audio Portal genres + reachability status |
| `/api/ng/genre/[genreKey]` | GET | Browse a genre (`?sort=score\|date\|views&page=`) |
| `/api/ng/search` | GET | Search the Audio Portal (2M+ submissions) |
| `/api/ng/charts` | GET | `?period=weekly\|monthly\|alltime` top tracks |
| `/api/ng/featured` | GET | The 13 featured collections (metadata) |
| `/api/ng/featured/[playlistId]` | GET | Tracks of one collection |
| `/api/ng/info/[ngId]` | GET | Submission metadata + resolved stream URLs |
| `/api/ng/audio/[ngId]` | GET | **Newgrounds audio proxy** – Range, 24h cache, mirror fallback |
| `/api/search/unified` | GET | YouTube + Newgrounds + NCS + GD + Audius, grouped |
| `/api/audio/[songId]` | GET/HEAD | **Streaming proxy** – Range support, fallbacks, `warm=1` preheat |
| `/api/trending` | GET | Charts, genre feeds, curated mixes |
| `/api/radio` | GET | Endless similar-track radio from any seed |
| `/api/lyrics` | GET | Synced LRC + plain lyrics |
| `/api/artist` | GET | Artist profile, top songs, releases, similar artists |
| `/api/auth/*` | POST/GET/DELETE | signup, login, social, logout, me (incl. delete) |
| `/api/library`, `/api/library/*` | GET/POST/DELETE | likes, history, followed artists, saved albums |
| `/api/playlists`, `/api/playlists/[id]`, `.../songs` | GET/POST/PATCH/DELETE | full playlist CRUD + reorder |
| `/api/settings`, `/api/notifications`, `/api/newsletter`, `/api/stats` | GET/POST/PATCH | account, alerts, subscriptions, listening stats |

## 🎵 Extra sources: NCS & Geometry Dash

**NoCopyrightSounds** (`src/lib/sources/ncs.ts`) — reached through the same Innertube engine. Channel
search (`NCS_AUTHOR_RE` filter matches ~100% of results), the verified *NCS: All Releases* playlist
(90 items), eight live genre feeds (Dubstep, House, DnB, Trap, Electronic, Chill, Gaming, Phonk) and
runtime playlist discovery. Titles are parsed from the house style
`Artist - Title | Genre | NCS - Copyright Free Music`, and artwork always resolves through
`i.ytimg.com/vi/{id}/mqdefault.jpg`. Tracks carry `provider: "ncs"` and a green **✓ free** badge.

**Geometry Dash soundtrack** (`src/lib/sources/geometrydash.ts`) — all 34 official level themes
(Stereo Madness → Fingerdash) from ForeverBound, DJVI, Waterflame, DJ-Nate, F-777, Dex Arson and MDK.
Each level is resolved to a real, full-length stream and ranked so gameplay/"all coins" uploads lose
to clean audio. `getNewgroundsAudioUrl()` builds the Newgrounds CDN URL and `ng:` ids are proxied by
the audio engine with Range support; because Newguards fronts its site with a bot guard
(**HTTP 403 "NG Guard"**) that refuses datacenter traffic, Innertube resolution is the primary path
and the Newgrounds CDN is used opportunistically when reachable.

## 🎼 Newgrounds Audio Portal (`src/lib/sources/newgrounds.ts`)

Full integration: **32 genres**, Audio Portal search, weekly/monthly/all-time charts, **13 featured
collections** (Geometry Dash Classics + 12 genre sets), per-submission metadata and a Range-aware
audio proxy. HTML is parsed with `cheerio` (og:audio → embedded script JSON → `/audio/load/{id}`).

**Reality check that shaped the implementation:** Newgrounds fronts every page with a bot guard and
answers datacenter IPs with `403 "NG Guard"`, while `audio.ngfiles.com` only serves
`{folder}/{id}_{slug}.mp3` — a slug readable only from those blocked pages (verified: all slug
variants 404). So every function scrapes for real when the portal answers and otherwise degrades to a
**resolved mirror**, meaning no dead rows and no dead ends:

```
ng:{id} → CDN file (scraped/guessed) → Audius full-length match
        → Innertube full-length match → partial-but-audible bytes → player auto-advance
```

Mirror decisions are memoised per submission, so seeking a mirrored track costs ~0.5s. Responses
carry `reachable` + `source: "newgrounds" | "mirror"`, tracks carry `provider` and a
`FREE — Newgrounds / Creative Commons` label, and the UI shows an "NG Guard blocked · mirrors live"
badge instead of pretending otherwise.

Verified end-to-end through the proxy: `206 Partial Content`, `audio/mpeg`,
`bytes 1000000-1032767/7491132` mid-file seek, and a complete **7,232,748-byte** full-length pull.

## 🎨 Design system

Every surface uses glassmorphism (`backdrop-filter: blur(20px)`, translucent gradients, hairline
borders, coloured glows): navbar, cards, buttons, inputs, dropdowns, modals, player, tooltips,
badges, toggles, sliders, progress bars, toasts, context menus and skeletons. Palette: space black
`#0a0a1a` → navy `#0d1b2a`, electric purple `#7b2ff7`, cosmic blue `#00d4ff`, nebula pink `#ff2e97`,
stardust gold `#ffd700`. Type: Space Grotesk (display) + Inter (body).

Motion: Lenis inertia scrolling synced to GSAP ScrollTrigger parallax, Framer Motion page/section
reveals, canvas starfield with three depth layers, drifting nebulae, periodic shooting stars,
orbiting planets, spinning vinyl, heart-burst likes, count-up stats, marquee titles. All of it
honours `prefers-reduced-motion` and the in-app reduced-motion setting.

## 📱 PWA

`public/manifest.webmanifest` + `public/sw.js` (offline app shell, cache-first audio with
query-insensitive keys, network-first API with cached fallbacks, push + notification click).
Installable on iOS, Android and desktop; lock-screen controls via the Media Session API; tracks can
be downloaded from any song menu for true offline playback.

## ☁️ Deployment

* **Frontend + API**: Vercel / Netlify / Railway / Render (Node runtime required for `youtubei.js`;
  `serverExternalPackages` is already configured). Set `DATABASE_URL` and `AUTH_SECRET`.
* **Database**: Supabase, Neon or any managed PostgreSQL.
* **Cache volume**: mount writable storage for `CALAMIFY_CACHE_DIR` if you want persistent audio caching.
* **Note on throttling**: some datacenter IPs are rate-limited by upstream CDNs. Calamify detects this
  automatically and re-routes to its full-length Audius backbone, so playback never dead-ends.

## 🧪 Try it

1. Search **“Bohemian Rhapsody”** → press play → audio starts within seconds.
2. Scrub to the middle → Range requests seek instantly.
3. Tap the ♥ on a track → open **Liked Songs** → it is there, persisted.
4. “…” menu → **Add to playlist** → create **Space Vibes** → open it → drag to reorder.
5. “…” menu → **Start radio** → endless similar tracks queue themselves.
6. Install the PWA from the browser menu and take it offline.
