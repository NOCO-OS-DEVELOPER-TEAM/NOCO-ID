import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, getCurrentUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  user_code: z.string().min(4),
});

/** Website: angemeldeter User genehmigt Device-Code */
export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const body = schema.parse(await req.json());
  const code = body.user_code.trim().toUpperCase();
  const row = await prisma.deviceCode.findUnique({ where: { userCode: code } });
  if (!row || row.expiresAt < new Date()) return json({ error: "Code ungültig oder abgelaufen" }, 400);
  if (row.approvedAt) return json({ ok: true, message: "Bereits genehmigt" });

  const { token } = await createSession(user.id, `Device ${row.clientId}`, row.clientId);
  await prisma.deviceCode.update({
    where: { id: row.id },
    data: {
      userId: user.id,
      approvedAt: new Date(),
      accessToken: token,
    },
  });
  await prisma.appGrant.upsert({
    where: { userId_clientId: { userId: user.id, clientId: row.clientId } },
    create: { userId: user.id, clientId: row.clientId },
    update: { lastSeenAt: new Date() },
  });
  return json({ ok: true, client_id: row.clientId });
}
