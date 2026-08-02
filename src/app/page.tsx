import Link from "next/link";

const pillars = [
  {
    id: "ai",
    title: "NOCO AI",
    text: "Die zentrale Intelligenz — Chat, Code, Ideen, Aufgaben. Läuft privat auf deinem PC und sync’t Limits über NOCO ID.",
  },
  {
    id: "lens",
    title: "NOCO Lens",
    text: "Visuelle Analyse für Bilder und Dokumente. Demnächst angebunden — bereits Teil der Architektur.",
  },
  {
    id: "memory",
    title: "NOCO Memory",
    text: "Organisiertes Langzeitgedächtnis für Fakten, Chats und Nutzung — sichtbar in deinem Account.",
  },
  {
    id: "search",
    title: "NOCO Search",
    text: "KI-Browser und Hub. Findet Zusammenhänge im Ökosystem und öffnet deinen NOCO-Account.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">NOCO ID · Ökosystem</p>
        <h1>
          Ein Konto.
          <br />
          Alle NOCO-Dienste.
        </h1>
        <p className="lede">
          NOCO ist keine einzelne App — es ist ein verbundenes KI-System. Mit einer NOCO ID
          steuerst du Nutzung, Premium, Geräte und Postfach zentral — wie eine Schaltzentrale
          für AI, Lens, Memory und Search.
        </p>
        <div className="cta-row">
          <Link href="/register" className="btn btn-primary">
            NOCO ID erstellen
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Anmelden
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Zum Hub
          </Link>
          <a
            className="btn btn-ghost"
            href="https://noco-os-developer-team.github.io/NOCO-ID/"
            target="_blank"
            rel="noreferrer"
          >
            Öffentliche Seite
          </a>
        </div>
      </section>

      <section id="ecosystem" className="section">
        <h2 className="section-title">Verbundene Intelligenz</h2>
        <p className="section-sub">
          Jeder Bereich speist denselben Account. Limits, Premium und Geräte live über die Website.
        </p>
        <div className="grid-2">
          {pillars.map((p) => (
            <article key={p.id} className="card pillar">
              <div className="pillar-id">{p.id}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card highlight">
          <h2>Account wie bei einer Plattform — nicht wie ein Formular</h2>
          <p>
            Profil bearbeiten, Mail lesen, Premium aktivieren, Geräte verbinden, Token-Verbrauch
            in Echtzeit sehen. NOCO AI X auf Windows meldet Nutzung an denselben Server.
          </p>
          <div className="cta-row">
            <Link href="/account" className="btn btn-primary">
              Account-Einstellungen
            </Link>
            <Link href="/connect" className="btn btn-ghost">
              Gerät verbinden
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
