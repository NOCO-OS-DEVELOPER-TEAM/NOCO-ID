import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const { id } = await ctx.params;
  const msg = await prisma.inboxMessage.findFirst({ where: { id, userId: user.id } });
  if (!msg) return json({ error: "Nachricht nicht gefunden" }, 404);
  if (!msg.readAt) {
    await prisma.inboxMessage.update({ where: { id }, data: { readAt: new Date() } });
  }
  return json({
    message: {
      id: msg.id,
      subject: msg.subject,
      body: msg.body,
      kind: msg.kind,
      created_at: msg.createdAt.toISOString(),
    },
  });
}
