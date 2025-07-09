# 🏅 Spielolympiade

Web-App zur Verwaltung und Visualisierung der jährlichen Spielolympiade.

---

## 📦 Projektstruktur

```
spielolympiade/
├── backend/            # Express + Prisma + PostgreSQL
├── frontend/           # Angular App
├── prisma/             # Prisma Schema & Seed
├── docker-compose.yml  # PostgreSQL-Container
```

---

## 🐘 Datenbank (PostgreSQL)

### 1. Starten über Docker

```bash
docker-compose up -d
```

### 2. Prisma installieren & vorbereiten (nur einmalig nötig)

```bash
cd backend
npm install
npx prisma generate
```

### 3. Schema in DB pushen

```bash
npx prisma db push
```

### 4. Seed-Daten einfügen (z. B. historische Teams, Spieler, Spiele, Ergebnisse)

```bash
npx tsx prisma/seed.ts
```

---

## 🚀 Backend starten

```bash
cd backend
npm install
npm run dev
```

> Läuft standardmäßig unter: `http://localhost:3000`

---

## 💻 Frontend starten (Angular Standalone)

```bash
cd frontend
npm install
ng serve
```

> Erreichbar unter: `http://localhost:4200`

---

## ⚙️ .env Konfiguration

### backend/.env

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spielolympiade
PORT=3000
JWT_SECRET=dein_geheimer_jwt_schluessel
```

### frontend/.env (falls Vite verwendet wird)

```
VITE_API_URL=http://localhost:3000
```

---

## 🔐 Login Info (Testdaten)

- Admin: `bjarne`
- Andere Spieler: siehe `prisma/seed.ts` (z. B. `BJ`, `Julian`, etc.)

---

## ✅ Funktionen

- Login + Authentifizierung via JWT
- Teamansicht und eigene Matches
- Turnierverwaltung (zukünftig)
- Historienansicht vergangener Spielolympiaden
- Ergebnisverwaltung durch Admin (Edit, Delete)

---

## 🧠 Dev Notes

- Frontend verwendet Angular **Standalone Components**.
- Auth läuft über Interceptor + Token-Speicherung in `localStorage`.
- `proxy.conf.json` wird verwendet, um API-Calls lokal auf Port `3000` zu leiten.
- Vite wird **nicht verwendet** (Angular CLI).

---

## 🧹 Nützliche Befehle

```bash
# Backend neu bauen
npx prisma generate

# Prisma Migration erzeugen (optional)
npx prisma migrate dev --name init

# Seed erneut ausführen
npx tsx prisma/seed.ts
```

---

## 🛠️ ToDos

- [ ] Teamgenerator (Zufall / manuell)
- [ ] Verschiedene Turnierformen
- [ ] Live-Zustände über Websockets teilen
- [ ] Tabellen, Live-Matches & Ergebnisse filtern

---
Viel Spaß beim Zocken und Verwalten! 🍻
