import { json, options } from "@/lib/api";
import { probeCloudServices } from "@/lib/cloud";

export function OPTIONS() {
  return options();
}

/** Public local-cloud discovery (no auth) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hostsParam = url.searchParams.get("hosts") || url.searchParams.get("host") || "";
  const hosts = hostsParam
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  const companionPort = Number(url.searchParams.get("companion_port") || 4747);
  const idBase = url.searchParams.get("id_base") || undefined;

  const status = await probeCloudServices({
    hosts,
    companionPort: Number.isFinite(companionPort) ? companionPort : 4747,
    idBase,
  });

  return json({
    cloud: "noco-local",
    ...status,
  });
}
