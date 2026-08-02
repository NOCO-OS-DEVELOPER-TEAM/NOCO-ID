import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

/**
 * Lightweight presence heartbeat from desktop / search / mobile.
 * Body: { client_id, lan_url?, companion_url?, meta? }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);

  const body = (await req.json().catch(() => ({}))) as {
    client_id?: string;
    lan_url?: string;
    companion_url?: string;
    meta?: Record<string, unknown>;
  };

  const clientId = String(body.client_id || "").trim();
  if (!clientId) return json({ error: "client_id fehlt" }, 400);

  const lanUrl = typeof body.lan_url === "string" ? body.lan_url.trim() : undefined;
  const companionUrl =
    typeof body.companion_url === "string" ? body.companion_url.trim() : undefined;
  const meta = {
    ...(body.meta && typeof body.meta === "object" ? body.meta : {}),
    ...(companionUrl ? { companion_url: companionUrl } : {}),
  };

  const grant = await prisma.appGrant.upsert({
    where: {
      userId_clientId: { userId: user.id, clientId },
    },
    create: {
      userId: user.id,
      clientId,
      scopes: "profile,usage",
      lanUrl: lanUrl || companionUrl || null,
      meta: JSON.stringify(meta),
      lastSeenAt: new Date(),
    },
    update: {
      lanUrl: lanUrl || companionUrl || undefined,
      meta: JSON.stringify(meta),
      lastSeenAt: new Date(),
    },
  });

  return json({
    ok: true,
    client_id: grant.clientId,
    lan_url: grant.lanUrl,
    last_seen_at: grant.lastSeenAt.toISOString(),
  });
}
