import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const messages = await prisma.inboxMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({
    messages: messages.map((m) => ({
      id: m.id,
      subject: m.subject,
      kind: m.kind,
      read: !!m.readAt,
      created_at: m.createdAt.toISOString(),
      preview: m.body.slice(0, 120),
    })),
  });
}
