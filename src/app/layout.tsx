import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata = {
  title: "NOCO — KI-Ökosystem & Account",
  description:
    "NOCO ID verbindet NOCO AI, Lens, Memory und Search in einem Konto — wie eine zentrale Schaltzentrale.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <SiteNav />
          {children}
        </div>
      </body>
    </html>
  );
}
