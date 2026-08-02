import { SERVICES } from "./crypto";

export type CloudProbe = {
  id: string;
  name: string;
  online: boolean;
  url?: string;
  detail?: string;
  latency_ms?: number;
};

async function probeUrl(
  url: string,
  timeoutMs = 1800
): Promise<{ ok: boolean; latency_ms: number; detail?: string }> {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    return {
      ok: res.ok,
      latency_ms: Date.now() - started,
      detail: res.ok ? "ok" : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      latency_ms: Date.now() - started,
      detail: e instanceof Error ? e.message : "unreachable",
    };
  }
}

function hostList(extra?: string[]): string[] {
  const fromEnv = (process.env.NOCO_LAN_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hosts = ["127.0.0.1", ...fromEnv, ...(extra || [])];
  return [...new Set(hosts)];
}

export async function probeCloudServices(opts?: {
  hosts?: string[];
  companionPort?: number;
  idBase?: string;
}) {
  const hosts = hostList(opts?.hosts);
  const companionPort = opts?.companionPort || 4747;
  const companionUrls = hosts.map((h) => `http://${h}:${companionPort}/api/v1/ping`);
  const idUrls = opts?.idBase
    ? [`${opts.idBase.replace(/\/$/, "")}/api/v1/services`]
    : hosts.map((h) => `http://${h}:3000/api/v1/services`);

  let companion: CloudProbe = {
    id: "companion",
    name: "NOCO Companion",
    online: false,
    detail: "offline",
  };
  for (const url of companionUrls) {
    const r = await probeUrl(url);
    if (r.ok) {
      companion = {
        id: "companion",
        name: "NOCO Companion",
        online: true,
        url: url.replace(/\/ping$/, ""),
        latency_ms: r.latency_ms,
        detail: r.detail,
      };
      break;
    }
    companion.detail = r.detail;
  }

  let identity: CloudProbe = {
    id: "noco-id",
    name: "NOCO ID",
    online: true,
    url: opts?.idBase || "http://127.0.0.1:3000",
    detail: "self",
  };
  for (const url of idUrls) {
    const r = await probeUrl(url);
    if (r.ok) {
      identity = {
        id: "noco-id",
        name: "NOCO ID",
        online: true,
        url: url.replace(/\/api\/v1\/services$/, ""),
        latency_ms: r.latency_ms,
        detail: r.detail,
      };
      break;
    }
  }

  return {
    server_time: new Date().toISOString(),
    mode: "local-cloud" as const,
    hosts,
    companion_port: companionPort,
    probes: [identity, companion],
    catalog: SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.blurb,
      href: s.href,
      probe: s.probe,
    })),
  };
}

export function isDeviceOnline(lastSeenAt: Date, withinMs = 90_000) {
  return Date.now() - lastSeenAt.getTime() <= withinMs;
}
