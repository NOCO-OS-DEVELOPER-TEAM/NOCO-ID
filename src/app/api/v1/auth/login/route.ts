import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSession, ensureWallet, publicUser, setSessionCookie } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_name: z.string().optional(),
  app_id: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, include: { wallet: true } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return json({ error: "E-Mail oder Passwort falsch" }, 401);
    }
    if (!user.emailVerifiedAt) {
      return json({ error: "E-Mail noch nicht bestätigt", needs_verify: true }, 403);
    }
    const wallet = await ensureWallet(user.id, user.plan);
    const { token, expiresAt } = await createSession(
      user.id,
      body.device_name || "Web",
      body.app_id || "noco-id-web"
    );
    await setSessionCookie(token, expiresAt);
    if (body.app_id) {
      await prisma.appGrant.upsert({
        where: { userId_clientId: { userId: user.id, clientId: body.app_id } },
        create: { userId: user.id, clientId: body.app_id },
        update: { lastSeenAt: new Date() },
      });
    }
    return json({
      ok: true,
      token,
      expires_at: expiresAt.toISOString(),
      user: publicUser({ ...user, wallet }),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return json({ error: "Ungültige Eingabe" }, 400);
    return json({ error: e instanceof Error ? e.message : "Fehler" }, 500);
  }
}
