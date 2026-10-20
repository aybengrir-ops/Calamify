import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { completeOAuth, isProviderConfigured, type OAuthProvider } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const STATE_COOKIE = "calamify_oauth_state";

/** Step 2: exchange the code, link the identity, start the session, go home. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const home = new URL("/", url.origin);

  if (provider !== "google" && provider !== "github") {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  const p = provider as OAuthProvider;

  const providerError = url.searchParams.get("error");
  if (providerError) {
    home.searchParams.set("autherror", `${provider}:${providerError}`);
    return Response.redirect(home, 302);
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    home.searchParams.set("autherror", `${provider}:missing_code`);
    return Response.redirect(home, 302);
  }
  if (!isProviderConfigured(p)) {
    home.searchParams.set("autherror", `${provider}_not_configured`);
    return Response.redirect(home, 302);
  }

  // CSRF: the state must match the one we set when redirecting out
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  if (!expected || expected !== `${provider}:${state}`) {
    home.searchParams.set("autherror", `${provider}:state_mismatch`);
    return Response.redirect(home, 302);
  }

  try {
    await completeOAuth(p, code, req);
    home.searchParams.set("auth", "ok");
    return Response.redirect(home, 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    home.searchParams.set("autherror", `${provider}:${encodeURIComponent(message.slice(0, 80))}`);
    return Response.redirect(home, 302);
  }
}
