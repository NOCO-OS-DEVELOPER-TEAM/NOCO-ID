import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  display_name: z.string().min(2).max(64).optional(),
  birth_date: z.string().min(4).optional(),
  avatar_color: z.string().min(4).max(20).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const body = schema.parse(await req.json());
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: body.display_name?.trim() || undefined,
      birthDate: body.birth_date || undefined,
      avatarColor: body.avatar_color || undefined,
    },
    include: { wallet: true },
  });
  const wallet = await ensureWallet(updated.id, updated.plan);
  return json({ ok: true, user: publicUser({ ...updated, wallet }) });
}
