import { prisma } from "@/lib/db";
import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { json, options } from "@/lib/api";
import { SERVICES } from "@/lib/crypto";
import { isDeviceOnline, probeCloudServices } from "@/lib/cloud";

export function OPTIONS() {
  return options();
}

/** Live snapshot for desktop/browser clients + cloud hub */
export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const wallet = await ensureWallet(user.id, user.plan);
  const devices = await prisma.appGrant.findMany({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
  });
  const recent = await prisma.usageLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const cloud = await probeCloudServices();
  const companionOnline = cloud.probes.find((p) => p.id === "companion")?.online ?? false;
  const grantByClient = new Map(devices.map((d) => [d.clientId, d]));

  const services = SERVICES.map((s) => {
    const grant = grantByClient.get(s.id);
    const connected = Boolean(grant);
    const lastSeen = grant?.lastSeenAt;
    let online = false;
    if (s.probe === "self") online = true;
    else if (s.probe === "companion") online = companionOnline || (lastSeen ? isDeviceOnline(lastSeen) : false);
    else if (lastSeen) online = isDeviceOnline(lastSeen);

    let meta: Record<string, unknown> = {};
    try {
      meta = grant?.meta ? (JSON.parse(grant.meta) as Record<string, unknown>) : {};
    } catch {
      meta = {};
    }

    return {
      id: s.id,
      name: s.name,
      description: s.blurb,
      href: s.href,
      online,
      connected,
      last_seen: lastSeen ? lastSeen.toISOString() : null,
      lan_url: grant?.lanUrl || (typeof meta.companion_url === "string" ? meta.companion_url : null),
    };
  });

  return json({
    server_time: new Date().toISOString(),
    cloud: {
      mode: cloud.mode,
      probes: cloud.probes,
    },
    user: publicUser({ ...user, wallet }),
    services,
    devices: devices.map((d) => ({
      client_id: d.clientId,
      scopes: d.scopes,
      lan_url: d.lanUrl,
      last_seen_at: d.lastSeenAt.toISOString(),
      online: isDeviceOnline(d.lastSeenAt),
    })),
    recent_usage: recent.map((r) => ({
      service: r.service,
      amount: r.amount,
      created_at: r.createdAt.toISOString(),
    })),
  });
}
