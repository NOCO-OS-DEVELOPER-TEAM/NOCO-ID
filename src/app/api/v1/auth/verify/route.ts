import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, ensureWallet, publicUser, setSessionCookie } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, include: { wallet: true } });
    if (!user) return json({ error: "Konto nicht gefunden" }, 404);

    const record = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: "signup",
        usedAt: null,
        expiresAt: { gt: new Date() },
        code: body.code.trim(),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!record) return json({ error: "Code ungültig oder abgelaufen" }, 403);

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      include: { wallet: true },
    });
    await ensureWallet(updated.id, updated.plan);
    const { token, expiresAt } = await createSession(updated.id);
    await setSessionCookie(token, expiresAt);

    return json({
      ok: true,
      token,
      expires_at: expiresAt.toISOString(),
      user: publicUser({ ...updated, wallet: await ensureWallet(updated.id, updated.plan) }),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return json({ error: "Ungültige Eingabe" }, 400);
    return json({ error: e instanceof Error ? e.message : "Fehler" }, 500);
  }
}
