import { NextRequest, NextResponse } from "next/server";
import { authorizationUrl, isProviderConfigured, newState, type OAuthProvider } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "calamify_oauth_state";

/** Step 1 of the OAuth code flow: redirect the browser to Google / GitHub. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== "google" && provider !== "github") {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  if (!isProviderConfigured(provider as OAuthProvider)) {
    return NextResponse.redirect(new URL(`/?autherror=${encodeURIComponent(`${provider}_not_configured`)}`, req.url), 302);
  }
  const state = newState();
  const url = authorizationUrl(req, provider as OAuthProvider, state);
  const res = NextResponse.redirect(url, 302);
  res.cookies.set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return res;
}
