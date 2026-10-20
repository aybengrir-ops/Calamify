import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const HOST = process.env.ACRCLOUD_HOST || "identify-eu-west-1.acrcloud.com";

/** ACRCloud signature v1: POST /v1/identify with an HMAC-SHA1 signature. */
function signature(body: Buffer, stringToSign: string, secret: string): string {
  return createHmac("sha1", secret).update(stringToSign, "utf8").digest("base64");
}

/**
 * Real fingerprint recognition when `ACRCLOUD_CLIENT_KEY` + `_SECRET` are set.
 * Without credentials the client falls back to on-device DSP matching.
 */
export async function POST(req: NextRequest) {
  const key = process.env.ACRCLOUD_CLIENT_KEY;
  const secret = process.env.ACRCLOUD_CLIENT_SECRET;
  if (!key || !secret) {
    return Response.json(
      { provider: "local", error: "No fingerprint provider configured (set ACRCLOUD_CLIENT_KEY and ACRCLOUD_CLIENT_SECRET)" },
      { status: 501 }
    );
  }

  const form = await req.formData();
  const file = form.get("sample") as File | null;
  if (!file) return Response.json({ error: "Missing 'sample' audio" }, { status: 400 });
  const sample = Buffer.from(await file.arrayBuffer());
  const startSeconds = Number(form.get("start") || 0);

  const timestamp = Math.floor(Date.now() / 1000);
  const fields = {
    access_key: key,
    data_type: "audio",
    signature_version: "1",
    timestamp: String(timestamp),
  };
  const stringToSign = ["POST", "/v1/identify", fields.access_key, fields.data_type, fields.signature_version, fields.timestamp].join("\n");

  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  body.append("signature", signature(sample, stringToSign, secret));
  body.append("sample", new Blob([sample]), "clip.webm");
  body.append("sample_bytes", String(sample.byteLength));
  body.append("start_seconds", String(startSeconds));

  try {
    const upstream = await fetch(`https://${HOST}/v1/identify`, { method: "POST", body, signal: AbortSignal.timeout(30000) });
    const data = await upstream.json();
    const hit = data?.metadata?.music?.[0];
    return Response.json({
      provider: "acrcloud",
      status: data?.status?.code ?? upstream.status,
      match: hit
        ? {
            title: hit.title,
            artist: hit.artists?.map((a: any) => a.name).join(", ") || "",
            album: hit.album?.name || "",
            score: hit.score,
            releaseDate: hit.release_date || null,
            external: hit.external_metadata || null,
          }
        : null,
      raw: hit ? undefined : data,
    });
  } catch (error) {
    return Response.json({ provider: "acrcloud", error: error instanceof Error ? error.message : "Recognition failed" }, { status: 502 });
  }
}
