/* Calamify recognition worker — all DSP runs off the main thread.
 *
 * Pipeline: mono downmix (done by caller) → linear resample to 8 kHz →
 * noise gate + silence trim → STFT (512/128, Hann) → constellation
 * fingerprint (band-pair hashes) → coarse inverted-index vote → fine
 * envelope cross-correlation around the winning offset → score + offset.
 *
 * No network, no build step, no heavy work at deploy time.
 */
(function () {
  "use strict";

  var TARGET_SR = 8000;
  var FRAME = 512;
  var HOP = 128;
  var BANDS = 16;
  var MAX_PEAKS = 3;

  /* ---------------- FFT (iterative radix-2) ---------------- */
  function fft(re, im) {
    var n = re.length, i, j, bit, len, ang, wr, wi, k, ur, ui, vr, vi, t;
    for (i = 1, j = 0; i < n; i++) {
      bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (len = 2; len <= n; len <<= 1) {
      ang = (-2 * Math.PI) / len;
      wr = Math.cos(ang); wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          ur = re[i + k]; ui = im[i + k];
          vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
  }

  /* ---------------- resample (linear) ---------------- */
  function resample(samples, fromSr, toSr) {
    if (!fromSr || Math.abs(fromSr - toSr) < 1) return samples;
    var ratio = fromSr / toSr;
    var outLen = Math.floor(samples.length / ratio);
    var out = new Float32Array(outLen);
    for (var i = 0; i < outLen; i++) {
      var pos = i * ratio;
      var i0 = Math.floor(pos);
      var i1 = Math.min(samples.length - 1, i0 + 1);
      var frac = pos - i0;
      out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
    }
    return out;
  }

  /* ---------------- noise gate + silence trim ---------------- */
  function gateAndTrim(samples) {
    var win = 512, i, n = samples.length;
    if (n < win * 2) return samples;
    var blocks = Math.floor(n / win);
    var rms = new Float32Array(blocks);
    var peak = 0;
    for (i = 0; i < blocks; i++) {
      var sum = 0;
      for (var j = 0; j < win; j++) { var v = samples[i * win + j]; sum += v * v; }
      rms[i] = Math.sqrt(sum / win);
      if (rms[i] > peak) peak = rms[i];
    }
    if (peak <= 0) return samples;
    var floor = peak * 0.06; // noise gate
    var first = 0, last = blocks - 1;
    while (first < blocks - 1 && rms[first] < floor) first++;
    while (last > first && rms[last] < floor) last--;
    var start = first * win, end = Math.min(n, (last + 1) * win);
    var out = new Float32Array(end - start);
    out.set(samples.subarray(start, end));
    return out;
  }

  /* ---------------- log band edges ---------------- */
  function bandEdges() {
    var fMin = 100, fMax = 3800, edges = [];
    for (var b = 0; b <= BANDS; b++) edges.push(fMin * Math.pow(fMax / fMin, b / BANDS));
    return edges;
  }

  /* ---------------- fingerprint ---------------- */
  function fingerprint(samples, sampleRate) {
    var sr = sampleRate || TARGET_SR;
    var x = resample(samples, sr, TARGET_SR);
    x = gateAndTrim(x);
    var edges = bandEdges();
    var frames = Math.max(1, Math.floor((x.length - FRAME) / HOP));
    var re = new Float32Array(FRAME), im = new Float32Array(FRAME);
    var mag = new Float32Array(FRAME / 2);
    var env = new Float32Array(frames);
    var hashes = [];   // Int32: hash value
    var times = [];    // Int32: frame index
    var bandMag = new Float32Array(frames * BANDS);

    for (var f = 0; f < frames; f++) {
      var off = f * HOP, e = 0;
      for (var i = 0; i < FRAME; i++) {
        var s = x[off + i] || 0;
        var w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1));
        re[i] = s * w; im[i] = 0; e += s * s;
      }
      env[f] = Math.sqrt(e / FRAME);
      fft(re, im);
      for (var k = 0; k < FRAME / 2; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);

      // per-band magnitude + peak pick
      var peaks = [];
      var total = 0;
      for (var b = 0; b < BANDS; b++) {
        var k0 = Math.max(1, Math.floor((edges[b] * FRAME) / TARGET_SR));
        var k1 = Math.min(mag.length - 1, Math.ceil((edges[b + 1] * FRAME) / TARGET_SR));
        var best = -1, bestV = 0, sum = 0, cnt = 0;
        for (var kk = k0; kk <= k1; kk++) { sum += mag[kk]; cnt++; if (mag[kk] > bestV) { bestV = mag[kk]; best = kk; } }
        var avg = cnt ? sum / cnt : 0;
        bandMag[f * BANDS + b] = avg;
        total += avg;
        if (best >= 0 && bestV > avg * 1.25) peaks.push({ band: b, mag: bestV });
      }
      peaks.sort(function (p, q) { return q.mag - p.mag; });
      peaks = peaks.slice(0, MAX_PEAKS);
      // constellation: pair the strongest bands in this frame
      for (var p1 = 0; p1 < peaks.length; p1++) {
        for (var p2 = p1 + 1; p2 < peaks.length; p2++) {
          var a = peaks[p1].band, c = peaks[p2].band;
          if (a > c) { var tmp = a; a = c; c = tmp; }
          hashes.push(a * BANDS + c);
          times.push(f);
        }
      }
    }

    // normalise the envelope for cross-correlation
    var envMax = 0;
    for (f = 0; f < frames; f++) if (env[f] > envMax) envMax = env[f];
    if (envMax > 0) for (f = 0; f < frames; f++) env[f] /= envMax;

    return {
      hashes: Int32Array.from(hashes),
      times: Int32Array.from(times),
      env: env,
      frames: frames,
      sampleRate: TARGET_SR,
      hop: HOP
    };
  }

  /* ---------------- coarse: inverted index votes ---------------- */
  function coarse(clip, cand) {
    var index = new Map();
    for (var i = 0; i < cand.hashes.length; i++) {
      var h = cand.hashes[i];
      var arr = index.get(h);
      if (!arr) { arr = []; index.set(h, arr); }
      arr.push(cand.times[i]);
    }
    var votes = new Map();
    var matched = 0;
    for (var j = 0; j < clip.hashes.length; j++) {
      var list = index.get(clip.hashes[j]);
      if (!list) continue;
      matched++;
      var ct = clip.times[j];
      for (var q = 0; q < list.length; q++) {
        var off = list[q] - ct;
        if (off < -4000 || off > 4000) continue;
        votes.set(off, (votes.get(off) || 0) + 1);
      }
    }
    var best = [], totalVotes = 0;
    votes.forEach(function (v, off) { best.push({ off: off, votes: v }); totalVotes += v; });
    best.sort(function (a, b) { return b.votes - a.votes; });
    // a true match concentrates its votes on ONE offset; coincidental hash
    // collisions scatter theirs – this is what rejects songs not in the corpus
    var concentration = totalVotes > 0 ? best[0].votes / totalVotes : 0;
    return { best: best.slice(0, 6), matched: matched, total: clip.hashes.length, concentration: concentration };
  }

  /* ---------------- fine: envelope cross-correlation ---------------- */
  function envelopeScore(clip, cand, offsetFrames) {
    var n = clip.frames, i, count = 0;
    var lo = Math.max(0, -offsetFrames), hi = Math.min(n, cand.frames - offsetFrames);
    if (hi - lo < 8) return 0;
    var mA = 0, mB = 0;
    for (i = lo; i < hi; i++) { mA += clip.env[i]; mB += cand.env[i + offsetFrames]; }
    count = hi - lo; mA /= count; mB /= count;
    var num = 0, da = 0, db = 0;
    for (i = lo; i < hi; i++) {
      var x = clip.env[i] - mA, y = cand.env[i + offsetFrames] - mB;
      num += x * y; da += x * x; db += y * y;
    }
    var denom = Math.sqrt(da * db);
    if (!denom) return 0;
    return Math.max(0, num / denom); // Pearson correlation, 0..1
  }

  /* ---------------- match ---------------- */
  function match(clip, candidates) {
    var results = [];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (cancelled) break;
      var co = coarse(clip, c.fp);
      if (!co.best.length || !co.total) continue;
      var top = co.best[0];
      var hashRatio = top.votes / Math.max(1, Math.min(co.total, c.fp.hashes.length));
      var envScore = envelopeScore(clip, c.fp, top.off);
      // also test the runner-up offsets and keep the best
      for (var k = 1; k < co.best.length; k++) {
        var alt = envelopeScore(clip, c.fp, co.best[k].off);
        if (alt > envScore) { envScore = alt; top = co.best[k]; }
      }
      var score = Math.max(0, Math.min(1, hashRatio * 0.5 + envScore * 0.22 + co.concentration * 0.28));
      results.push({
        id: c.id,
        score: score,
        hashRatio: hashRatio,
        envScore: envScore,
        concentration: co.concentration,
        offsetSeconds: (top.off * clip.hop) / clip.sampleRate,
        matchedHashes: co.matched
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  }

  var cancelled = false;

  /* ---------------- messaging ---------------- */
  if (typeof self !== "undefined" && typeof self.postMessage === "function") {
    self.onmessage = function (e) {
      var d = e.data || {};
      if (d.type === "cancel") { cancelled = true; return; }
      cancelled = false;
      if (d.type === "fingerprint") {
        var t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
        var fp = fingerprint(d.samples, d.sampleRate);
        var t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
        self.postMessage(
          { type: "fingerprinted", id: d.id, fp: fp, ms: t1 - t0 },
          [fp.hashes.buffer, fp.times.buffer, fp.env.buffer]
        );
      } else if (d.type === "match") {
        var m0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
        var out = match(d.clip, d.candidates);
        var m1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
        self.postMessage({ type: "matched", results: out, ms: m1 - m0 });
      } else if (d.type === "ping") {
        self.postMessage({ type: "pong" });
      }
    };
  }

  /* exported for Node-side unit testing (harmless in the browser) */
  if (typeof globalThis !== "undefined") {
    globalThis.__calamifyDsp = { fft: fft, resample: resample, gateAndTrim: gateAndTrim, fingerprint: fingerprint, coarse: coarse, envelopeScore: envelopeScore, match: match };
  }
})();
