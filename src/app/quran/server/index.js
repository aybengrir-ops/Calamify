import express from 'express';
import cors from 'cors';
import { Innertube, UniversalCache } from 'youtubei.js';

const app = express();

// Allow CORS for Vercel and local requests
app.use(cors({ origin: '*' }));

let yt = null;

// Initialize YouTubei Engine with local decipher session
async function getYouTube() {
  if (!yt) {
    try {
      yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        retrieve_player: true,
        client_type: 'ANDROID'
      });
      console.log('[YouTubei Engine] Initialized successfully with ANDROID client');
    } catch (err) {
      console.error('[YouTubei Init Error]:', err.message);
      yt = await Innertube.create({ generate_session_locally: true });
    }
  }
  return yt;
}

// Health Check Endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', engine: 'youtubei', time: new Date().toISOString() });
});

// Audio Stream Proxy Endpoint with 4-Tier Fallback
app.get('/api/audio/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const title = req.query.title || '';
  const artist = req.query.artist || '';

  console.log(`[Audio Proxy] Requesting audio for: ${videoId} (${artist} - ${title})`);

  try {
    const youtube = await getYouTube();
    let format = null;
    let info = null;

    // 1️⃣ Tier 1: Try ANDROID Client Context
    try {
      info = await youtube.getInfo(videoId, 'ANDROID');
      format = info.chooseFormat({ type: 'audio', quality: 'best' });
    } catch (e1) {
      console.warn(`[Tier 1 Failed] ANDROID for ${videoId}: ${e1.message}`);
    }

    // 2️⃣ Tier 2: Try YTMUSIC Client Context
    if (!format) {
      try {
        info = await youtube.getInfo(videoId, 'YTMUSIC');
        format = info.chooseFormat({ type: 'audio', quality: 'best' });
      } catch (e2) {
        console.warn(`[Tier 2 Failed] YTMUSIC for ${videoId}: ${e2.message}`);
      }
    }

    // 3️⃣ Tier 3: Try TV_EMBEDDED Client Context (Bypasses Datacenter IP Blocks)
    if (!format) {
      try {
        info = await youtube.getInfo(videoId, 'TV_EMBEDDED');
        format = info.chooseFormat({ type: 'audio', quality: 'best' });
      } catch (e3) {
        console.warn(`[Tier 3 Failed] TV_EMBEDDED for ${videoId}: ${e3.message}`);
      }
    }

    // 4️⃣ Tier 4: AUTO-SEARCH FALLBACK (If primary Video ID is dead or blocked)
    if (!format) {
      const querySearch = `${artist} ${title} audio`.trim();
      console.log(`[Tier 4] Primary ID failed. Executing Auto-Search Fallback for: "${querySearch}"`);
      try {
        const searchResults = await youtube.search(querySearch, { type: 'video' });
        if (searchResults.videos && searchResults.videos.length > 0) {
          const fallbackId = searchResults.videos[0].id;
          console.log(`[Tier 4 Success] Found alternative working video ID: ${fallbackId}`);
          info = await youtube.getInfo(fallbackId, 'ANDROID');
          format = info.chooseFormat({ type: 'audio', quality: 'best' });
        }
      } catch (e4) {
        console.error(`[Tier 4 Failed] Search Fallback: ${e4.message}`);
      }
    }

    if (!format) {
      console.error(`[Proxy Error] All 4 tiers failed for videoId: ${videoId}`);
      return res.status(404).json({ error: 'Audio stream unavailable on YouTube' });
    }

    // Decipher Stream URL
    const streamUrl = format.decipher(youtube.session.player);

    if (!streamUrl) {
      return res.status(500).json({ error: 'Failed to decipher audio stream URL' });
    }

    // Fetch raw audio stream with spoofed Android Mobile Headers
    const audioRes = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
      }
    });

    if (!audioRes.ok) {
      throw new Error(`Upstream audio request failed HTTP ${audioRes.status}`);
    }

    // Stream Response to Frontend
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const reader = audioRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();

    req.on('close', () => {
      try { reader.cancel(); } catch (e) {}
    });

  } catch (err) {
    console.error(`[Fatal Audio Proxy Error] ${videoId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Audio Proxy Error', details: err.message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Calamify Audio Proxy listening on port ${PORT}`);
});