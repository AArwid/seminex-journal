# Seminex Journal

Ett Node.js-baserat REST API för verifierbara journalhändelser för hästinseminering. Kritiska händelser (godkända parningar/insemineringar, vaccinationer) skyddas av en egen Proof-of-Work-blockkedja och kan aldrig ändras eller raderas i efterhand. Lokal CRUD-data (hästprofiler, ägare, stamtavla, journalanteckningar) lagras i SQLite via `better-sqlite3`.

## Kom igång

1. Kopiera `.env.example` till `.env`.
2. Installera beroenden med `npm install`.
3. Starta utvecklingsservern med `npm run dev` (eller `npm start` för produktion).

Servern lyssnar på porten som anges av `PORT` (standard `3000`).

## Miljövariabler

| Variabel         | Beskrivning                                                  | Standard                    |
| ---------------- | ------------------------------------------------------------ | --------------------------- |
| `PORT`           | Port som Express-servern lyssnar på.                         | `3000`                      |
| `POW_DIFFICULTY` | Antal inledande nollor som krävs vid mining (Proof-of-Work). | `1`                         |
| `DATABASE_PATH`  | Sökväg till SQLite-databasfilen.                             | `./data/seminex-journal.db` |

## Tester

Arbetet drivs testdrivet (TDD): skriv ett misslyckande test först, implementera minsta möjliga kod för att få det grönt, kör sedan den relevanta testsviten.

```bash
npm test            # kör hela testsviten en gång
npm run test:watch  # kör tester i bevakningsläge
```

Enhetstester (`tests/unit`) täcker `Block`, `Blockchain`, SQLite-modellerna och `JournalService` isolerat. Integrationstester (`tests/integration`) täcker hela HTTP-API:t med Express och en `:memory:`-databas via `supertest`.

## Arkitektur och struktur

```text
src/
  app.js         Express-app (dependency injection av JournalService)
  server.js      Produktions-/dev-entrypoint, kopplar ihop riktiga beroenden
  errors.js      Delade HTTP-felklasser (400/404/422)
  controllers/   Tunn HTTP-hantering, delegerar till services
  engine/        Block och Blockchain (Proof-of-Work, state-validering)
  middleware/    404- och central felhantering
  models/        SQLite-schema och dataåtkomst (better-sqlite3)
  routes/        Express-routes
  services/      Affärsregler som samordnar journal- och blockkedjeoperationer
tests/
  integration/   API- och databastester (supertest, :memory:-databas)
  unit/          Enhetstester
data/            Lokal SQLite-data, ej versionshanterad
```

## Datamodell

### Blockkedja (oföränderlig historik)

Varje mine:at block innehåller en lista av transaktioner. Varje transaktion har:

| Fält        | Typ    | Beskrivning                                        |
| ----------- | ------ | -------------------------------------------------- |
| `id`        | string | Stabilt unikt id för transaktionen.                |
| `horseId`   | string | Hästen händelsen gäller.                           |
| `type`      | string | T.ex. `"vaccination"` eller `"mating"`.            |
| `timestamp` | string | ISO-tidsstämpel.                                   |
| `payload`   | object | Domänspecifik data, t.ex. `{ vaccine, occasion }`. |

Domänregler som valideras innan en transaktion läggs i `pendingTransactions`:

- En vaccination får inte registreras dubbelt för samma häst, vaccin och tillfälle.
- En parning/inseminering får inte skapa konflikt med en redan godkänd händelse för samma häst.
- Transaktionen måste referera till en registrerad häst (kontrolleras mot SQLite).

### SQLite (CRUD- och läsdata)

**`horses`**: `id`, `name`, `breed`, `birth_date`, `owner`, `mother_id`, `father_id`.

**`journal_entries`**: `id`, `horse_id`, `note`, `author`, `created_at`.

## API-exempel

### Hämta hela kedjan och pending-poolen

```bash
curl http://localhost:3000/api/chain
```

```json
{
  "chain": [{ "index": 0, "previousHash": "0", "hash": "..." }],
  "pendingTransactions": []
}
```

### Lägg till en transaktion

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
        "id": "tx-1",
        "horseId": "h1",
        "type": "vaccination",
        "timestamp": "2026-01-01T00:00:00.000Z",
        "payload": { "vaccine": "flu", "occasion": "2026-01-01" }
      }'
```

Svar: `201 Created` med transaktionen, `400` för felaktig/ogiltig JSON, `422` om hästen inte finns eller en affärsregel bryts (t.ex. dubbel vaccination).

### Mine:a pending-poolen

```bash
curl -X POST http://localhost:3000/api/mine
```

Svar: `201 Created` med det nya blocket.

### Verifiera en hästs historik och härledda status

```bash
curl http://localhost:3000/api/verify/h1
```

```json
{
  "horse": { "id": "h1", "name": "Thunder", "owner": "Anna" },
  "history": [{ "id": "tx-1", "type": "vaccination", "horseId": "h1" }],
  "pendingTransactions": [],
  "status": { "isVaccinated": true, "approvedMatings": 0 }
}
```

Svar: `404` om hästen inte finns.

## Felhantering

Alla fel returneras som konsekvent JSON: `{ "error": "meddelande" }` med korrekt statuskod (`400`, `404`, `422`, `500`). Stack traces exponeras aldrig i svaret.
