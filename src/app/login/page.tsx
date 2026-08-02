"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        app_id: "noco-id-web",
        device_name: "NOCO Web",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.needs_verify) {
        router.push(`/verify?email=${encodeURIComponent(String(fd.get("email")))}`);
        return;
      }
      setError(data.error || "Login fehlgeschlagen");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Anmelden</h1>
        <p className="muted">Mit deiner NOCO ID — gültig für alle Dienste.</p>
        <label>
          E-Mail
          <input name="email" type="email" required />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "…" : "Einloggen"}
        </button>
        <p className="muted small">
          Neu? <Link href="/register">NOCO ID erstellen</Link>
        </p>
      </form>
    </main>
  );
}
