# Seminex Journal

Ett Node.js-baserat REST API for verifierbara journalhandelser for hastinsemenering. Kritiska handelser skyddas av en egen Proof-of-Work-blockkedja och lokal CRUD-data lagras i SQLite med `better-sqlite3`.

## Kom igang

1. Kopiera `.env.example` till `.env`.
2. Installera beroenden med `npm install`.
3. Starta utvecklingsservern med `npm run dev`.

## Tester

Skriv testet forst och kor sedan:

```bash
npm test
```

## Struktur

```text
src/
  controllers/  HTTP-hantering
  engine/       Block och blockkedja
  middleware/   Validering och felhantering
  models/       SQLite-atkomst
  routes/       Express-routes
  services/     Affarsregler
tests/
  integration/  API- och databas-tester
  unit/         Enhetstester
data/           Lokal SQLite-data, ej versionshanterad
```
