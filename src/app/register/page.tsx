"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        display_name: fd.get("display_name"),
        birth_date: fd.get("birth_date"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registrierung fehlgeschlagen");
      return;
    }
    if (data.verification_code) {
      sessionStorage.setItem("noco_verify_code", String(data.verification_code));
    }
    router.push(`/verify?email=${encodeURIComponent(String(fd.get("email")))}`);
  }

  return (
    <main className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>NOCO ID erstellen</h1>
        <p className="muted">Ein Konto für AI, Search, Memory und alle Geräte.</p>
        <label>
          Anzeigename
          <input name="display_name" required minLength={2} placeholder="Noah" />
        </label>
        <label>
          E-Mail
          <input name="email" type="email" required placeholder="du@mail.de" />
        </label>
        <label>
          Geburtsdatum
          <input name="birth_date" type="date" required />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required minLength={8} placeholder="mind. 8 Zeichen" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Erstelle…" : "Konto anlegen"}
        </button>
        <p className="muted small">
          Nach der Registrierung liegt der Code in <Link href="/mail">NOCO Mail</Link>.
        </p>
      </form>
    </main>
  );
}
