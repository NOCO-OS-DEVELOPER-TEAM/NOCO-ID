"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Msg = {
  id: string;
  subject: string;
  kind: string;
  read: boolean;
  created_at: string;
  preview: string;
};

export default function MailPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [active, setActive] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/v1/mail");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
    })();
  }, [router]);

  async function openMsg(id: string) {
    const res = await fetch(`/api/v1/mail/${id}`);
    const data = await res.json();
    if (res.ok) setActive(data.message);
  }

  return (
    <main>
      <section className="page-head">
        <div>
          <p className="eyebrow">NOCO Mail</p>
          <h1>Posteingang</h1>
          <p className="muted">Dein Konto-Postfach — Bestätigungscodes und Systemnachrichten.</p>
        </div>
        <Link href="/dashboard" className="btn btn-ghost">
          Zurück zum Hub
        </Link>
      </section>

      <div className="mail-layout">
        <div className="card mail-list">
          {messages.length === 0 ? (
            <p className="muted">Keine Nachrichten.</p>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mail-row ${m.read ? "" : "unread"}`}
                onClick={() => void openMsg(m.id)}
              >
                <strong>{m.subject}</strong>
                <span>{m.preview}</span>
                <em>{new Date(m.created_at).toLocaleString("de-DE")}</em>
              </button>
            ))
          )}
        </div>
        <div className="card mail-read">
          {active ? (
            <>
              <h2>{active.subject}</h2>
              <pre className="mail-body">{active.body}</pre>
            </>
          ) : (
            <p className="muted">Wähle eine Nachricht.</p>
          )}
        </div>
      </div>
    </main>
  );
}
