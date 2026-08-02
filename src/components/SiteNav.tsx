import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function SiteNav() {
  const user = await getCurrentUser();
  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="brand-mark" />
        NOCO
      </Link>
      <nav className="nav-links">
        <Link href="/#ecosystem">Ökosystem</Link>
        {user ? (
          <>
            <Link href="/dashboard">Hub</Link>
            <Link href="/mail">Mail</Link>
            <Link href="/account">Account</Link>
            <Link href="/connect">Geräte</Link>
          </>
        ) : (
          <>
            <Link href="/login">Anmelden</Link>
            <Link href="/register" className="btn btn-primary">
              NOCO ID erstellen
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
