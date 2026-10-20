import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureSettings, startSession, usernameFromEmail } from "@/lib/auth";
import { pushNotification } from "@/lib/data";

/**
 * OAuth 2.0 / OpenID Connect for Google + GitHub.
 *
 * Credentials are read from the environment ONLY (`GOOGLE_CLIENT_ID`,
 * `GITHUB_CLIENT_SECRET`, …) — never from source. Sessions are signed JWT
 * cookies, and each external identity is stored in the `accounts` table
 * (the NextAuth `Account` model equivalent) so one user can link both.
 */

export type OAuthProvider = "google" | "github";

interface ProviderConfig {
  label: string;
  authUrl: string;
  tokenUrl: string;
  userUrl: string;
  scope: string;
  idEnv: string;
  secretEnv: string;
  prompt?: string;
}

export const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    label: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
    prompt: "select_account",
  },
  github: {
    label: "GitHub",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    idEnv: "GITHUB_CLIENT_ID",
    secretEnv: "GITHUB_CLIENT_SECRET",
  },
};

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const cfg = PROVIDERS[provider];
  return Boolean(process.env[cfg.idEnv] && process.env[cfg.secretEnv]);
}

export function configuredProviders() {
  return (Object.keys(PROVIDERS) as OAuthProvider[]).map((p) => ({ provider: p, label: PROVIDERS[p].label, configured: isProviderConfigured(p) }));
}

/**
 * Absolute app origin. The incoming request wins (so preview domains, custom
 * domains and localhost all produce the correct redirect_uri); APP_URL /
 * NEXTAUTH_URL is only a fallback for proxies that hide the real host.
 */
export function appOrigin(req: Request): string {
  const url = new URL(req.url);
  const fwdHost = req.headers.get("x-forwarded-host");
  const host = fwdHost || url.host;
  const isLoopback = /^(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/.test(host);
  if (!isLoopback) {
    // Public origins are TLS-terminated at the edge, and edge proxies commonly
    // forward `x-forwarded-proto: http` for the internal hop. Trust an explicit
    // APP_URL/NEXTAUTH_URL when it targets this host, otherwise assume https so
    // the redirect_uri matches what the browser (and Google/GitHub) actually see.
    const configured = process.env.APP_URL || process.env.NEXTAUTH_URL;
    if (configured) {
      try {
        const c = new URL(configured);
        if (c.host === host) return configured.replace(/\/+$/, "");
      } catch {
        /* fall through */
      }
    }
    const fwd = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    return `${fwd === "https" ? "https" : "https"}://${host}`;
  }
  const configured = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function redirectUri(req: Request, provider: OAuthProvider): string {
  return `${appOrigin(req)}/api/auth/callback/${provider}`;
}

export function newState(): string {
  return randomBytes(18).toString("hex");
}

export function authorizationUrl(req: Request, provider: OAuthProvider, state: string): string {
  const cfg = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: process.env[cfg.idEnv] || "",
    redirect_uri: redirectUri(req, provider),
    response_type: "code",
    scope: cfg.scope,
    state,
  });
  if (cfg.prompt) params.set("prompt", cfg.prompt);
  return `${cfg.authUrl}?${params.toString()}`;
}

export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
}

/** Exchange the authorization code for tokens. */
async function exchangeCode(provider: OAuthProvider, code: string, req: Request): Promise<Record<string, any>> {
  const cfg = PROVIDERS[provider];
  const body = new URLSearchParams({
    client_id: process.env[cfg.idEnv] || "",
    client_secret: process.env[cfg.secretEnv] || "",
    code,
    redirect_uri: redirectUri(req, provider),
    grant_type: "authorization_code",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      ...(provider === "github" ? { "User-Agent": "Calamify" } : {}),
    },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // GitHub may answer form-encoded
    const parsed: Record<string, string> = {};
    for (const part of text.split("&")) {
      const [k, v] = part.split("=");
      if (k) parsed[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
    return parsed;
  }
}

/** Fetch the provider profile with the access token. */
async function fetchProfile(provider: OAuthProvider, accessToken: string): Promise<Record<string, any>> {
  const cfg = PROVIDERS[provider];
  const res = await fetch(cfg.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(provider === "github" ? { "User-Agent": "Calamify" } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${provider} profile request failed (${res.status})`);
  return res.json();
}

/** Complete the code flow: tokens → profile → local user + account row → session. */
export async function completeOAuth(provider: OAuthProvider, code: string, req: Request): Promise<{ userId: string; email: string; name: string }> {
  const tokens = await exchangeCode(provider, code, req);
  const accessToken: string = tokens.access_token || "";
  if (!accessToken) throw new Error(tokens.error_description || tokens.error || "No access token returned");

  const raw = await fetchProfile(provider, accessToken);
  let email: string | null = null;
  let name: string | null = null;
  let image: string | null = null;
  let providerAccountId = "";

  if (provider === "google") {
    email = (raw.email || "").toLowerCase() || null;
    name = raw.name || raw.given_name || null;
    image = raw.picture || null;
    providerAccountId = String(raw.sub || "");
  } else {
    email = (raw.email || "").toLowerCase() || null;
    name = raw.name || raw.login || null;
    image = raw.avatar_url || null;
    providerAccountId = String(raw.id || raw.login || "");
  }

  // GitHub hides emails behind a noreply address when the user keeps it private.
  if (!email && provider === "github") {
    email = `${raw.login}@users.noreply.github.com`;
    name = name || raw.login || "GitHub Explorer";
  }
  if (!email || !providerAccountId) throw new Error("Provider did not return an identifier");

  const providerAccount = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
    .limit(1);

  let user = providerAccount[0]
    ? (await db.select().from(users).where(eq(users.id, providerAccount[0].userId)).limit(1))[0]
    : undefined;

  if (!user) {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    user = existing[0];
  }

  if (!user) {
    let username = usernameFromEmail(email);
    const clash = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (clash[0]) username = `${username}${Math.floor(Math.random() * 9000 + 1000)}`;
    [user] = await db
      .insert(users)
      .values({
        email,
        username,
        displayName: name || email.split("@")[0],
        provider,
        avatarUrl: image,
        avatarSeed: username,
        emailVerified: new Date(),
      })
      .returning();
    await ensureSettings(user.id);
    await pushNotification(user.id, {
      type: "welcome",
      title: `Signed in with ${PROVIDERS[provider].label} ✨`,
      body: "Your cosmic library has been created. Guest likes and history were merged in.",
      link: "/library",
    });
  } else if (image && !user.avatarUrl) {
    [user] = await db.update(users).set({ avatarUrl: image, emailVerified: user.emailVerified || new Date() }).where(eq(users.id, user.id)).returning();
  }

  await db
    .insert(accounts)
    .values({
      userId: user.id,
      provider,
      providerAccountId,
      accessToken,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + Number(tokens.expires_in) : null,
      tokenType: tokens.token_type || null,
      scope: tokens.scope || PROVIDERS[provider].scope,
    })
    .onConflictDoUpdate({
      target: [accounts.provider, accounts.providerAccountId],
      set: { accessToken, refreshToken: tokens.refresh_token || null, expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + Number(tokens.expires_in) : null },
    });

  await startSession(user.id);
  return { userId: user.id, email, name: user.displayName };
}
