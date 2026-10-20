import { ncsCollections, discoverNCSPlaylists } from "@/lib/sources/ncs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Curated NCS playlists + live genre feeds + freshly discovered playlists. */
export async function GET() {
  const [collections, discovered] = await Promise.all([
    Promise.resolve(ncsCollections()),
    discoverNCSPlaylists(8).catch(() => []),
  ]);
  const seen = new Set(collections.map((c) => c.id));
  const extra = discovered
    .filter((d) => !seen.has(d.id) && !seen.has(`topic:${d.id}`))
    .map((d) => ({ id: d.id, name: d.name, icon: "📀", description: `${d.count ? d.count + " tracks · " : ""}Discovered live from the NCS index` }));
  return Response.json({ playlists: [...collections, ...extra] });
}
