# NOCO ID

Zentrales Konto für das **NOCO-Ökosystem** — AI, Lens, Memory, Search, Geräte.

Wie eine Account-Zentrale: Profil, Mail, Premium, Limits und verbundene Apps an einem Ort.

## Schnellstart (lokal)

```bash
cd NOCO-ID
npm install
npx prisma db push
npm run dev
```

Öffne [http://127.0.0.1:3000](http://127.0.0.1:3000)

1. **NOCO ID erstellen** → Code wird angezeigt (Simulation) + liegt in NOCO Mail nach Login  
2. Bestätigen → **Hub** mit Live-Limits  
3. **Account** → Premium (kostenlos/simuliert)  
4. **Geräte** → Code aus NOCO AI X bestätigen  

## Drei Schichten (Cloud-Gefühl)

| Schicht | Was | Wo |
|---------|-----|-----|
| **GitHub Pages** | Öffentliche Landing + Auto-Discover der lokalen Dienste | Ordner `pages-site/` |
| **NOCO ID (:3000)** | Account-Cloud: Login, Hub, Limits, Geräte, Mail | dieses Repo (`npm run dev`) |
| **Companion (:4747)** | NOCO AI Desktop — Chat, Vision, Browser-Agent-Plan | Windows NOCO AI |

Pages findet `127.0.0.1` (und gespeicherte LAN-IPs). Die echte Account-API läuft lokal (oder später auf Vercel).

## API (`/api/v1`)

| Endpoint | Beschreibung |
|----------|----------------|
| `POST /auth/register` | Registrierung |
| `POST /auth/verify` | E-Mail-Code |
| `POST /auth/login` | Login → Token |
| `POST /auth/logout` | Logout |
| `GET /me` | Profil + Wallet |
| `PATCH /me/profile` | Profil bearbeiten |
| `GET /me/live` | Live-Snapshot inkl. `services[]` + Cloud-Probes |
| `GET/POST /me/usage` | Limits lesen / Verbrauch melden |
| `POST /me/premium` | Premium an/aus (simuliert) |
| `POST /devices/heartbeat` | Geräte-Präsenz (client_id, lan_url) |
| `GET /cloud/status` | Öffentlicher LAN-Status (Companion + ID) |
| `GET /mail` | NOCO Mail |
| `POST /oauth/device/code` | Device-Flow starten |
| `POST /oauth/device/token` | Token pollen |
| `POST /oauth/device/approve` | Code auf Website genehmigen |
| `GET /services` | Dienst-Katalog |

## NOCO AI X Anbindung

1. Website lokal starten (`npm run dev`)  
2. In NOCO AI X → Statusleiste → **Account**  
3. Server: `http://127.0.0.1:3000`  
4. Login oder Geräte-Code  
5. Chat/Bilder melden Verbrauch → Hub zeigt Limits live  
6. Heartbeat meldet Companion-URL → Hub zeigt „online“

## GitHub Pages

**Öffentliche URL:** https://noco-os-developer-team.github.io/NOCO-ID/

1. Repo Settings → Pages → Source: **GitHub Actions**  
2. Workflow `.github/workflows/pages.yml` deployt `pages-site/`  
3. Landing scannt lokale Cloud und verlinkt Login/Hub  

Diese URL ist die öffentliche Einstiegsseite. Account-API bleibt lokal auf `:3000` (oder später Vercel).

## Vercel Deploy (öffentliche Account-API, später)

1. Repo: `NOCO-OS-DEVELOPER-TEAM/NOCO-ID`  
2. Vercel → Import GitHub Repo  
3. Für Produktion **Neon Postgres** anlegen und in `prisma/schema.prisma` Provider auf `postgresql` stellen  
4. Env Vars:

```
DATABASE_URL=postgresql://...
SESSION_SECRET=<langes-geheimnis>
NEXT_PUBLIC_APP_URL=https://noco-id.vercel.app
```

5. Build Command: `prisma generate && prisma db push && next build`  
6. Deploy  

Bis Neon angebunden ist, läuft alles stabil lokal mit SQLite.

## Ökosystem-Bereiche (Website)

- **NOCO AI** — zentrale KI (Desktop + Companion)  
- **NOCO Lens** — Vision (Architektur, Integration folgt)  
- **NOCO Memory** — Account-/Nutzungsdaten  
- **NOCO Search** — Browser mit Agent (Ausführen / Chat)  

## Premium

Kostenloser Toggle in Account-Einstellungen. Hebt Limits praktisch auf. Kein Stripe in Phase 1.
