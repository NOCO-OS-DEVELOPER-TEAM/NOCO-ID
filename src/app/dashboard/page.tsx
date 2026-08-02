"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Live = {
  user: {
    display_name: string;
    email: string;
    plan: string;
    wallet: {
      daily_tokens: number;
      daily_used: number;
      image_credits: number;
      image_used: number;
      vision_credits: number;
      vision_used: number;
      code_credits: number;
      code_used: number;
      search_credits: number;
      search_used: number;
    } | null;
  };
  devices: { client_id: string; last_seen_at: string }[];
  recent_usage: { service: string; amount: number; created_at: string }[];
};

function Bar({ used, cap, label }: { used: number; cap: number; label: string }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, cap)) * 100));
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <strong>
          {used} / {cap >= 100000 ? "∞" : cap}
        </strong>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/v1/me/live");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setLive(data);
  }

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2500);
    return () => clearInterval(id);
  }, []);

  if (!live) {
    return (
      <main>
        <p className="muted">{error || "Lade Hub…"}</p>
      </main>
    );
  }

  const w = live.user.wallet;

  return (
    <main>
      <section className="page-head">
        <div>
          <p className="eyebrow">NOCO Hub · live</p>
          <h1>Hallo, {live.user.display_name}</h1>
          <p className="muted">
            {live.user.email} · Plan:{" "}
            <strong className={live.user.plan === "premium" ? "tag-premium" : ""}>
              {live.user.plan === "premium" ? "Premium" : "Free"}
            </strong>
            {" · "}
            Aktualisiert alle 2,5 s
          </p>
        </div>
        <div className="cta-row">
          <Link href="/account" className="btn btn-primary">
            Account
          </Link>
          <Link href="/mail" className="btn btn-ghost">
            Mail
          </Link>
        </div>
      </section>

      <section className="grid-2">
        <article className="card">
          <h2>Nutzungslimits</h2>
          <p className="muted small">Von NOCO AI X und anderen Clients gemeldet</p>
          {w && (
            <>
              <Bar label="Chat" used={w.daily_used} cap={w.daily_tokens} />
              <Bar label="Bilder" used={w.image_used} cap={w.image_credits} />
              <Bar label="Vision / Lens" used={w.vision_used} cap={w.vision_credits} />
              <Bar label="Code" used={w.code_used} cap={w.code_credits} />
              <Bar label="Search" used={w.search_used} cap={w.search_credits} />
            </>
          )}
        </article>

        <article className="card">
          <h2>Ökosystem</h2>
          <ul className="service-list">
            <li>
              <strong>NOCO AI</strong>
              <span>Desktop · Limits sync</span>
            </li>
            <li>
              <strong>NOCO Lens</strong>
              <span>Bald · Vision-Quota</span>
            </li>
            <li>
              <strong>NOCO Memory</strong>
              <span>Account-Daten</span>
            </li>
            <li>
              <strong>NOCO Search</strong>
              <span>Browser-Hub</span>
            </li>
          </ul>
          <Link href="/account" className="btn btn-primary" style={{ marginTop: 16 }}>
            Premium verwalten
          </Link>
        </article>
      </section>

      <section className="grid-2" style={{ marginTop: 20 }}>
        <article className="card">
          <h2>Geräte</h2>
          {live.devices.length === 0 ? (
            <p className="muted">Noch keine Apps verbunden. <Link href="/connect">Verbinden</Link></p>
          ) : (
            <ul className="service-list">
              {live.devices.map((d) => (
                <li key={d.client_id}>
                  <strong>{d.client_id}</strong>
                  <span>{new Date(d.last_seen_at).toLocaleString("de-DE")}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="card">
          <h2>Letzte Aktivität</h2>
          {live.recent_usage.length === 0 ? (
            <p className="muted">Noch keine Nutzung gemeldet.</p>
          ) : (
            <ul className="service-list">
              {live.recent_usage.map((u, i) => (
                <li key={`${u.created_at}-${i}`}>
                  <strong>{u.service}</strong>
                  <span>
                    ×{u.amount} · {new Date(u.created_at).toLocaleTimeString("de-DE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
