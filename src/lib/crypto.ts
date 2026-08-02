import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export function newVerificationCode() {
  return String(randomInt(100000, 999999));
}

export function newUserCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) out += "-";
    out += alphabet[randomInt(0, alphabet.length)];
  }
  return out;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export const FREE_LIMITS = {
  dailyTokens: 50,
  imageCredits: 10,
  visionCredits: 20,
  codeCredits: 30,
  searchCredits: 100,
} as const;

export const PREMIUM_LIMITS = {
  dailyTokens: 1_000_000,
  imageCredits: 1_000_000,
  visionCredits: 1_000_000,
  codeCredits: 1_000_000,
  searchCredits: 1_000_000,
} as const;

export const SERVICES = [
  {
    id: "noco-ai-desktop",
    name: "NOCO AI",
    blurb: "Private lokale KI auf deinem Windows-PC",
    href: "https://github.com/NOCO-OS-DEVELOPER-TEAM/NOCO-AI",
  },
  {
    id: "noco-search",
    name: "NOCO Search",
    blurb: "Browser mit NOCO-KI — Hub fürs Ökosystem",
    href: "#",
  },
  {
    id: "noco-ios",
    name: "NOCO AI Mobile",
    blurb: "iPhone-Fernbedienung für deinen PC",
    href: "https://github.com/NOCO-OS-DEVELOPER-TEAM/NOCO-AI-IOS-IPA",
  },
  {
    id: "noco-os",
    name: "NOCO OS",
    blurb: "Simuliertes Betriebssystem im NOCO-Universum",
    href: "https://github.com/NOCO-OS-DEVELOPER-TEAM/NOCO-OS-WORKSPACE",
  },
] as const;
