import { SERVICES } from "@/lib/crypto";
import { json, options } from "@/lib/api";

export function OPTIONS() {
  return options();
}

export async function GET() {
  return json({
    services: SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.blurb,
      href: s.href,
    })),
  });
}
