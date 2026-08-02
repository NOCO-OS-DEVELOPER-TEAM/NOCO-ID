import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { newUserCode } from "@/lib/crypto";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

const schema = z.object({
  client_id: z.enum(["noco-ai-desktop", "noco-search", "noco-ios", "noco-os"]),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const deviceCode = randomBytes(24).toString("hex");
  const userCode = newUserCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  await prisma.deviceCode.create({
    data: {
      clientId: body.client_id,
      deviceCode,
      userCode,
      expiresAt,
    },
  });
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return json({
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: `${base}/connect`,
    verification_uri_complete: `${base}/connect?code=${userCode}`,
    expires_in: 600,
    interval: 5,
  });
}
