import { prisma } from "./db";
import { newVerificationCode } from "./crypto";

export async function sendVerificationMail(userId: string, email: string, purpose: "signup" | "login" | "email_change" = "signup") {
  const code = newVerificationCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await prisma.verificationCode.create({
    data: { userId, code, purpose, expiresAt },
  });

  const subject =
    purpose === "signup"
      ? "Willkommen bei NOCO ID — dein Bestätigungscode"
      : purpose === "login"
        ? "Dein NOCO-Anmeldecode"
        : "NOCO E-Mail ändern — Bestätigungscode";

  const body = [
    `Hallo,`,
    ``,
    `dein NOCO-Bestätigungscode lautet:`,
    ``,
    `    ${code}`,
    ``,
    `Er ist 15 Minuten gültig.`,
    ``,
    `Diese Nachricht liegt in deinem NOCO Mail-Postfach.`,
    `(Simulation — in Produktion kann echte E-Mail über Resend angebunden werden.)`,
    ``,
    `— NOCO ID`,
  ].join("\n");

  await prisma.inboxMessage.create({
    data: {
      userId,
      subject,
      body,
      kind: "verification",
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[NOCO Mail] ${email} → code ${code} (${purpose})`);
  }

  return { code, expiresAt };
}

export async function sendSystemMail(userId: string, subject: string, body: string) {
  return prisma.inboxMessage.create({
    data: { userId, subject, body, kind: "system" },
  });
}
