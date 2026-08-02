"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  display_name: string;
  email: string;
  birth_date: string;
  avatar_color: string;
  plan: string;
  email_verified: boolean;
  created_at: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/v1/me");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setUser(data.user);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: fd.get("display_name"),
        birth_date: fd.get("birth_date"),
        avatar_color: fd.get("avatar_color"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Speichern fehlgeschlagen");
      return;
    }
    setUser(data.user);
    setMsg("Profil gespeichert.");
  }

  async function togglePremium(enabled: boolean) {
    setMsg(null);
    const res = await fetch("/api/v1/me/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setUser(data.user);
    setMsg(data.note || (enabled ? "Premium aktiv" : "Free aktiv"));
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) return <main><p className="muted">Lade Account…</p></main>;

  return (
    <main>
      <section className="page-head">
        <div>
          <p className="eyebrow">Account-Einstellungen</p>
          <h1>Dein NOCO-Konto</h1>
          <p className="muted">Alles zentral bearbeiten — Profil, Premium, Sicherheit.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
          Abmelden
        </button>
      </section>

      <div className="grid-2">
        <form className="card" onSubmit={saveProfile}>
          <h2>Profil</h2>
          <label>
            Anzeigename
            <input name="display_name" defaultValue={user.display_name} required />
          </label>
          <label>
            E-Mail
            <input value={user.email} disabled />
          </label>
          <label>
            Geburtsdatum
            <input name="birth_date" type="date" defaultValue={user.birth_date} required />
          </label>
          <label>
            Akzentfarbe
            <input name="avatar_color" type="color" defaultValue={user.avatar_color} />
          </label>
          <p className="muted small">
            Verifiziert: {user.email_verified ? "ja" : "nein"} · Seit{" "}
            {new Date(user.created_at).toLocaleDateString("de-DE")}
          </p>
          {error && <p className="error">{error}</p>}
          {msg && <p className="ok">{msg}</p>}
          <button className="btn btn-primary" type="submit">
            Speichern
          </button>
        </form>

        <article className="card">
          <h2>NOCO Premium</h2>
          <p className="muted">
            Simulation — kostenlos aktivierbar. Hebt Chat-, Bild-, Vision-, Code- und Search-Limits
            praktisch auf. Später echte Abos möglich.
          </p>
          <p>
            Status:{" "}
            <strong className={user.plan === "premium" ? "tag-premium" : ""}>
              {user.plan === "premium" ? "Premium" : "Free"}
            </strong>
          </p>
          {user.plan === "premium" ? (
            <button type="button" className="btn btn-ghost" onClick={() => void togglePremium(false)}>
              Premium deaktivieren
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => void togglePremium(true)}>
              Premium aktivieren (kostenlos)
            </button>
          )}
          <hr className="sep" />
          <h3>Daten & Privacy</h3>
          <p className="muted small">
            Nutzung wird von verbundenen Apps (z. B. NOCO AI X) an diesen Account gemeldet und
            erscheint live im Hub. NOCO Lens folgt später.
          </p>
          <Link href="/dashboard" className="btn btn-ghost">
            Live-Nutzung öffnen
          </Link>
        </article>
      </div>
    </main>
  );
}
