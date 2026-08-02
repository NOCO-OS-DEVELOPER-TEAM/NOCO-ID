import { cookies } from "next/headers";
import { prisma } from "./db";
import { FREE_LIMITS, PREMIUM_LIMITS, hashToken, newSessionToken } from "./crypto";

export const COOKIE_NAME = "noco_session";

export async function createSession(userId: string, deviceName = "Web", appId = "noco-id-web") {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      deviceName,
      appId,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionTokenFromRequest(req?: Request) {
  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
  }
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(req?: Request) {
  const token = await getSessionTokenFromRequest(req);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { wallet: true },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function ensureWallet(userId: string, plan: string) {
  const limits = plan === "premium" ? PREMIUM_LIMITS : FREE_LIMITS;
  let wallet = await prisma.tokenWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.tokenWallet.create({
      data: {
        userId,
        dailyTokens: limits.dailyTokens,
        imageCredits: limits.imageCredits,
        visionCredits: limits.visionCredits,
        codeCredits: limits.codeCredits,
        searchCredits: limits.searchCredits,
        dailyResetAt: new Date(),
      },
    });
    return wallet;
  }

  const now = new Date();
  const resetNeeded =
    now.getUTCFullYear() !== wallet.dailyResetAt.getUTCFullYear() ||
    now.getUTCMonth() !== wallet.dailyResetAt.getUTCMonth() ||
    now.getUTCDate() !== wallet.dailyResetAt.getUTCDate();

  if (resetNeeded) {
    wallet = await prisma.tokenWallet.update({
      where: { userId },
      data: {
        dailyUsed: 0,
        imageUsed: 0,
        visionUsed: 0,
        codeUsed: 0,
        searchUsed: 0,
        dailyResetAt: now,
        dailyTokens: limits.dailyTokens,
        imageCredits: limits.imageCredits,
        visionCredits: limits.visionCredits,
        codeCredits: limits.codeCredits,
        searchCredits: limits.searchCredits,
      },
    });
  } else if (plan === "premium") {
    wallet = await prisma.tokenWallet.update({
      where: { userId },
      data: {
        dailyTokens: limits.dailyTokens,
        imageCredits: limits.imageCredits,
        visionCredits: limits.visionCredits,
        codeCredits: limits.codeCredits,
        searchCredits: limits.searchCredits,
      },
    });
  }
  return wallet;
}

export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  birthDate: string;
  avatarColor: string;
  plan: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  wallet?: {
    dailyTokens: number;
    dailyUsed: number;
    imageCredits: number;
    imageUsed: number;
    visionCredits: number;
    visionUsed: number;
    codeCredits: number;
    codeUsed: number;
    searchCredits: number;
    searchUsed: number;
    dailyResetAt: Date;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    birth_date: user.birthDate,
    avatar_color: user.avatarColor,
    plan: user.plan,
    email_verified: !!user.emailVerifiedAt,
    created_at: user.createdAt.toISOString(),
    wallet: user.wallet
      ? {
          daily_tokens: user.wallet.dailyTokens,
          daily_used: user.wallet.dailyUsed,
          image_credits: user.wallet.imageCredits,
          image_used: user.wallet.imageUsed,
          vision_credits: user.wallet.visionCredits,
          vision_used: user.wallet.visionUsed,
          code_credits: user.wallet.codeCredits,
          code_used: user.wallet.codeUsed,
          search_credits: user.wallet.searchCredits,
          search_used: user.wallet.searchUsed,
          daily_reset_at: user.wallet.dailyResetAt.toISOString(),
        }
      : null,
  };
}
