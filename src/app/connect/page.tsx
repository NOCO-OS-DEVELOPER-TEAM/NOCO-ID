"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ConnectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void fetch("/api/v1/me").then(async (res) => {
      if (res.status === 401) router.push("/login?next=/connect");
      else setAuthed(true);
    });
  }, [router]);

  async function approve(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await fetch("/api/v1/oauth/device/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg(`Gerät verbunden: ${data.client_id}`);
  }

  if (!authed) return <p className="muted">Prüfe Anmeldung…</p>;

  return (
    <>
      <section className="page-head">
        <div>
          <p className="eyebrow">Geräte verbinden</p>
          <h1>NOCO AI X & Apps</h1>
          <p className="muted">
            Code aus der Windows-App eingeben — danach fließen Limits live in diesen Account.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-ghost">
          Hub
        </Link>
      </section>

      <div className="grid-2">
        <form className="card" onSubmit={approve}>
          <h2>User-Code genehmigen</h2>
          <label>
            Code (z. B. ABCD-EFGH)
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="XXXX-XXXX"
            />
          </label>
          {error && <p className="error">{error}</p>}
          {msg && <p className="ok">{msg}</p>}
          <button className="btn btn-primary" type="submit">
            Verbinden
          </button>
        </form>

        <article className="card">
          <h2>Für Entwickler / Desktop</h2>
          <ol className="steps">
            <li>
              <code>POST /api/v1/oauth/device/code</code> mit{" "}
              <code>{`{ "client_id": "noco-ai-desktop" }`}</code>
            </li>
            <li>User öffnet diese Seite und bestätigt den <code>user_code</code></li>
            <li>
              App pollt <code>POST /api/v1/oauth/device/token</code> → Bearer Token
            </li>
            <li>
              Nutzung melden: <code>POST /api/v1/me/usage</code>
            </li>
            <li>
              Live-Status: <code>GET /api/v1/me/live</code>
            </li>
          </ol>
          <p className="muted small">
            Lokal: Website auf <code>http://127.0.0.1:3000</code>, NOCO AI X im selben WLAN/PC.
          </p>
        </article>
      </div>
    </>
  );
}

export default function ConnectPage() {
  return (
    <main>
      <Suspense>
        <ConnectInner />
      </Suspense>
    </main>
  );
}
