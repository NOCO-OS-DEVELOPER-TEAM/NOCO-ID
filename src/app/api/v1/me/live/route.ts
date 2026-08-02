import { prisma } from "@/lib/db";
import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

/** Live snapshot for desktop/browser clients */
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
  return json({
    server_time: new Date().toISOString(),
    user: publicUser({ ...user, wallet }),
    devices: devices.map((d) => ({
      client_id: d.clientId,
      scopes: d.scopes,
      last_seen_at: d.lastSeenAt.toISOString(),
    })),
    recent_usage: recent.map((r) => ({
      service: r.service,
      amount: r.amount,
      created_at: r.createdAt.toISOString(),
    })),
  });
}
