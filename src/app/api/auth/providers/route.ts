import { configuredProviders } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the UI which OAuth providers are really configured, so the buttons can
 * start the real code flow instead of the sandbox identity fallback.
 */
export async function GET() {
  const providers = configuredProviders();
  return Response.json({
    providers,
    anyConfigured: providers.some((p) => p.configured),
    credentials: true,
    authUrl: Object.fromEntries(providers.filter((p) => p.configured).map((p) => [p.provider, `/api/auth/${p.provider}`])),
  });
}
