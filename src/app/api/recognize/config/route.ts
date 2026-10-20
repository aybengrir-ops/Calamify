import { trendingTracks } from "@/lib/audius";
import { cacheSongs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * Recognition bootstrap: which tier is active and a default candidate pool.
 * Audius tracks are used for the default pool because they decode fast and are
 * guaranteed full-length, so browser-side fingerprinting stays responsive.
 */
export async function GET() {
  const hasProvider = Boolean(process.env.ACRCLOUD_CLIENT_KEY && process.env.ACRCLOUD_CLIENT_SECRET);
  const defaults = await trendingTracks({ limit: 14 }).catch(() => []);
  await cacheSongs(defaults);
  return Response.json({
    provider: hasProvider ? "acrcloud" : "local",
    defaults,
    clipSeconds: 6,
    bands: 24,
    note: hasProvider
      ? "ACRCloud credentials detected — /api/recognize performs real fingerprint lookup."
      : "No fingerprint provider configured — recognition runs fully on-device against the candidate pool.",
  });
}
