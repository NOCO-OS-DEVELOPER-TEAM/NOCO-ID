import { prisma } from "@/lib/db";
import { clearSessionCookie, getSessionTokenFromRequest } from "@/lib/auth";
import { hashToken } from "@/lib/crypto";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function POST(req: Request) {
  const token = await getSessionTokenFromRequest(req);
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  await clearSessionCookie();
  return json({ ok: true });
}
