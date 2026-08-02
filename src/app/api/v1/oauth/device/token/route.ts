import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  device_code: z.string(),
  client_id: z.string(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const row = await prisma.deviceCode.findUnique({ where: { deviceCode: body.device_code } });
  if (!row || row.clientId !== body.client_id) return json({ error: "ungültig" }, 400);
  if (row.expiresAt < new Date()) return json({ error: "expired", error_code: "expired_token" }, 400);
  if (!row.approvedAt || !row.accessToken) {
    return json({ error: "authorization_pending", error_code: "authorization_pending" }, 428);
  }
  return json({
    access_token: row.accessToken,
    token_type: "Bearer",
    expires_in: 60 * 60 * 24 * 30,
  });
}
