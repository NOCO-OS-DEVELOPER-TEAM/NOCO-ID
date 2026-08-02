import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit") || 30));
  const rows = await prisma.usageLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const wallet = await ensureWallet(user.id, user.plan);
  return json({
    wallet: publicUser({ ...user, wallet }).wallet,
    items: rows.map((r) => ({
      id: r.id,
      service: r.service,
      amount: r.amount,
      meta: JSON.parse(r.meta || "{}"),
      created_at: r.createdAt.toISOString(),
    })),
  });
}

const postSchema = z.object({
  service: z.enum(["chat", "image", "vision", "code", "search"]),
  amount: z.number().int().positive().default(1),
  meta: z.record(z.unknown()).optional(),
  client_id: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const body = postSchema.parse(await req.json());
  let wallet = await ensureWallet(user.id, user.plan);

  const fieldUsed =
    body.service === "chat"
      ? "dailyUsed"
      : body.service === "image"
        ? "imageUsed"
        : body.service === "vision"
          ? "visionUsed"
          : body.service === "code"
            ? "codeUsed"
            : "searchUsed";
  const fieldCap =
    body.service === "chat"
      ? "dailyTokens"
      : body.service === "image"
        ? "imageCredits"
        : body.service === "vision"
          ? "visionCredits"
          : body.service === "code"
            ? "codeCredits"
            : "searchCredits";

  const used = wallet[fieldUsed];
  const cap = wallet[fieldCap];
  if (used + body.amount > cap) {
    return json(
      {
        error: "Limit erreicht",
        service: body.service,
        used,
        limit: cap,
        hint: "Aktiviere NOCO Premium (kostenlos/simuliert) unter /account",
      },
      429
    );
  }

  wallet = await prisma.tokenWallet.update({
    where: { userId: user.id },
    data: { [fieldUsed]: used + body.amount },
  });

  await prisma.usageLedger.create({
    data: {
      userId: user.id,
      service: body.service,
      amount: body.amount,
      meta: JSON.stringify({ ...(body.meta || {}), client_id: body.client_id }),
    },
  });

  if (body.client_id) {
    await prisma.appGrant.upsert({
      where: { userId_clientId: { userId: user.id, clientId: body.client_id } },
      create: { userId: user.id, clientId: body.client_id },
      update: { lastSeenAt: new Date() },
    });
  }

  return json({
    ok: true,
    wallet: publicUser({ ...user, wallet }).wallet,
  });
}
