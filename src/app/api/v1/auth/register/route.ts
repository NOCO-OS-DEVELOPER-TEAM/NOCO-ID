import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { ensureWallet, publicUser } from "@/lib/auth";
import { sendVerificationMail, sendSystemMail } from "@/lib/mail";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  display_name: z.string().min(2).max(64),
  birth_date: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return json({ error: "E-Mail bereits registriert" }, 409);

    const colors = ["#1a6b5c", "#0e4d6e", "#7a4a1e", "#3d4f2f", "#5c2d4a"];
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        displayName: body.display_name.trim(),
        birthDate: body.birth_date,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      },
    });
    await ensureWallet(user.id, "free");
    const { code } = await sendVerificationMail(user.id, email, "signup");
    await sendSystemMail(
      user.id,
      "Dein NOCO-Konto ist bereit",
      "Willkommen im NOCO-Ökosystem. Bestätige deine E-Mail mit dem Code aus diesem Postfach. Danach kannst du NOCO AI, NOCO Search und weitere Dienste mit demselben Konto nutzen."
    );

    return json({
      ok: true,
      user_id: user.id,
      email,
      message: "Konto erstellt. Öffne NOCO Mail für deinen Bestätigungscode.",
      verify_hint: "Der Code liegt auch unten (Simulation) — später echte E-Mail.",
      // Simulation: Code direkt anzeigen, bis echtes SMTP angebunden ist
      verification_code: code,
    }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return json({ error: "Ungültige Eingabe", details: e.flatten() }, 400);
    return json({ error: e instanceof Error ? e.message : "Fehler" }, 500);
  }
}
