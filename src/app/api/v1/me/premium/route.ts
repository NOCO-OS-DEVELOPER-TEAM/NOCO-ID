import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { FREE_LIMITS, PREMIUM_LIMITS } from "@/lib/crypto";
import { sendSystemMail } from "@/lib/mail";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  enabled: z.boolean(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const body = schema.parse(await req.json());
  const plan = body.enabled ? "premium" : "free";
  const limits = plan === "premium" ? PREMIUM_LIMITS : FREE_LIMITS;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan },
  });
  const wallet = await prisma.tokenWallet.update({
    where: { userId: user.id },
    data: {
      dailyTokens: limits.dailyTokens,
      imageCredits: limits.imageCredits,
      visionCredits: limits.visionCredits,
      codeCredits: limits.codeCredits,
      searchCredits: limits.searchCredits,
    },
  });
  await sendSystemMail(
    user.id,
    plan === "premium" ? "NOCO Premium aktiviert" : "Zurück auf Free",
    plan === "premium"
      ? "Premium ist in dieser Simulation kostenlos und hebt deine Nutzungslimits praktisch auf."
      : "Du nutzt wieder die Free-Limits."
  );
  return json({
    ok: true,
    user: publicUser({ ...updated, wallet: await ensureWallet(updated.id, plan) }),
    note: "Premium ist simuliert und kostenlos — kein echtes Abo.",
  });
}
