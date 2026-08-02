"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hintCode, setHintCode] = useState<string | null>(null);

  useEffect(() => {
    const c = sessionStorage.getItem("noco_verify_code");
    if (c) setHintCode(c);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: fd.get("code") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Code ungültig");
      return;
    }
    sessionStorage.removeItem("noco_verify_code");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="card auth-card" onSubmit={onSubmit}>
      <h1>E-Mail bestätigen</h1>
      <p className="muted">
        Gib den 6-stelligen Code ein. In der Simulation erscheint er hier und später in NOCO Mail.
      </p>
      {hintCode && (
        <p className="ok">
          Dein Code (Simulation): <strong>{hintCode}</strong>
        </p>
      )}
      <label>
        E-Mail
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </label>
      <label>
        Bestätigungscode
        <input
          name="code"
          required
          placeholder="123456"
          pattern="[0-9]{6}"
          defaultValue={hintCode || ""}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" disabled={loading} type="submit">
        {loading ? "Prüfe…" : "Bestätigen & öffnen"}
      </button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <main className="auth-wrap">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
