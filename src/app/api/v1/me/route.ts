import { ensureWallet, getCurrentUser, publicUser } from "@/lib/auth";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);
  const wallet = await ensureWallet(user.id, user.plan);
  return json({ user: publicUser({ ...user, wallet }) });
}
