# Seminex Journal

A Node.js REST API for verifiable journal events related to horse insemination. Critical events, such as approved mating or insemination events and vaccinations, are protected by a custom Proof-of-Work blockchain and cannot be changed or deleted after they are mined. Local CRUD data, including horse profiles, owners, pedigrees, and journal entries, is stored in SQLite using `better-sqlite3`.

## Getting Started

1. Copy `.env.example` to `.env` if the file is available.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Optionally seed the database with sample horses and a journal entry:

   ```bash
   npm run seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   Use `npm start` for a production-style start.

The server listens on the port specified by `PORT`, which defaults to `3000`.

## Environment Variables

| Variable         | Description                                            | Default                     |
| ---------------- | ------------------------------------------------------ | --------------------------- |
| `PORT`           | Port used by the Express server.                       | `3000`                      |
| `POW_DIFFICULTY` | Number of leading zeroes required when mining a block. | `1`                         |
| `DATABASE_PATH`  | Path to the SQLite database file.                      | `./data/seminex-journal.db` |

## Tests

The project follows a test-driven development approach. Run the full test suite with:

```bash
npm test
```

Run tests in watch mode with:

```bash
npm run test:watch
```

Unit tests in `tests/unit` cover the blockchain engine, SQLite models, and services. Integration tests in `tests/integration` cover the Express HTTP API using `supertest` and an in-memory database.

## Architecture and Structure

```text
src/
  app.js         Express app factory with dependency injection
  server.js      Production/development entry point
  errors.js      Shared HTTP error classes (400/404/422)
  controllers/   Thin HTTP handlers that delegate to services
  engine/        Block and Blockchain implementations
  middleware/    404 handling and centralized error handling
  models/        SQLite schema and data access
  routes/        Express route definitions
  services/      Business rules for horses, journal entries, and blockchain events
tests/
  integration/   API and database tests
  unit/          Unit tests
data/            Local SQLite database files
```

## Data Model

### Blockchain

Each mined block contains a list of transactions. Every transaction has:

| Field       | Type   | Description                                            |
| ----------- | ------ | ------------------------------------------------------ |
| `id`        | string | Stable unique transaction ID.                          |
| `horseId`   | string | ID of the horse associated with the event.             |
| `type`      | string | For example, `"vaccination"` or `"mating"`.            |
| `timestamp` | string | ISO 8601 timestamp.                                    |
| `payload`   | object | Domain-specific data, such as `{ vaccine, occasion }`. |

The following rules are validated before a transaction is added to `pendingTransactions`:

- A horse cannot have duplicate vaccinations for the same vaccine and occasion.
- A mating or insemination event cannot conflict with an already approved mating event for the same horse.
- The transaction must refer to a registered horse in SQLite.

The blockchain currently exists in memory and is reset when the server restarts. Horse profiles and journal entries are persisted in SQLite.

### SQLite

The `horses` table contains:

`id`, `name`, `breed`, `birth_date`, `owner`, `mother_id`, `father_id`

The `journal_entries` table contains:

`id`, `horse_id`, `note`, `author`, `created_at`

## API Examples

The examples below assume the server is running at `http://localhost:3000`.

### Create a horse

```bash
curl -X POST http://localhost:3000/api/horses \
  -H "Content-Type: application/json" \
  -d '{
        "id": "h8",
        "name": "Silver",
        "breed": "Arabian",
        "birthDate": "2022-08-10",
        "owner": "Maria"
      }'
```

`id` and `name` are required. The response is `201 Created`.

### List horses

```bash
curl http://localhost:3000/api/horses
```

### Update a horse owner

```bash
curl -X PATCH http://localhost:3000/api/horses/h1/owner \
  -H "Content-Type: application/json" \
  -d '{ "owner": "Erik" }'
```

### Create a journal entry

```bash
curl -X POST http://localhost:3000/api/horses/h1/journal-entries \
  -H "Content-Type: application/json" \
  -d '{
        "note": "Routine checkup",
        "author": "Vet Lisa",
        "createdAt": "2026-09-04T10:00:00.000Z"
      }'
```

The horse must already exist, and `note` is required.

### List journal entries for a horse

```bash
curl http://localhost:3000/api/horses/h1/journal-entries
```

### Get the blockchain and pending transactions

```bash
curl http://localhost:3000/api/chain
```

Example response:

```json
{
  "chain": [{ "index": 0, "previousHash": "0", "hash": "..." }],
  "pendingTransactions": []
}
```

### Add a blockchain transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
        "id": "tx-1",
        "horseId": "h1",
        "type": "vaccination",
        "timestamp": "2026-09-04T10:00:00.000Z",
        "payload": { "vaccine": "flu", "occasion": "2026-09-04" }
      }'
```

The response is `201 Created` with the pending transaction. Invalid input returns `400`. An unknown horse or a violated business rule returns `422`.

### Mine pending transactions

```bash
curl -X POST http://localhost:3000/api/mine
```

The response is `201 Created` with the newly mined block. Mining moves all pending transactions into the blockchain.

### Verify a horse's blockchain history

```bash
curl http://localhost:3000/api/verify/h1
```

Example response:

```json
{
  "horse": { "id": "h1", "name": "Thunder", "owner": "Anna" },
  "history": [{ "id": "tx-1", "type": "vaccination", "horseId": "h1" }],
  "pendingTransactions": [],
  "status": { "isVaccinated": true, "approvedMatings": 0 }
}
```

This endpoint returns `404 Not Found` when the horse does not exist.

## Error Handling

Errors are returned as consistent JSON:

```json
{ "error": "Error message" }
```

The API uses status codes `400`, `404`, `422`, and `500` as appropriate. Stack traces are never exposed in API responses.

## Known Weaknesses and Risks

The following limitations were identified during a review of the current implementation. The API is suitable for local development and demonstration, but these issues should be addressed before exposing it to untrusted users or using it for production audit data.

### High Priority

#### No authentication or authorization

The API does not require login, an API key, or any other credential. Anyone who can reach the server can create horses, update owners, add blockchain transactions, and mine blocks. Keep the service on a trusted network until authentication and authorization are implemented.

#### Blockchain history is not persisted

The blockchain is stored in memory. Restarting the server removes all mined blocks, transactions, and pending transactions, while the SQLite horse and journal-entry data remains. This means the blockchain is not yet a durable audit trail.

#### Mining can block the server

Proof-of-Work mining runs synchronously in the main Node.js event loop. A high `POW_DIFFICULTY` value or repeated mining requests can consume CPU and make other API requests unresponsive. Mining should be moved to a worker, placed in a job queue, or protected with strict operational limits.

#### Duplicate transaction IDs are accepted

Transactions require an `id`, but the blockchain does not currently reject an ID that has already been used. The same event can therefore be submitted more than once. Transaction IDs should be checked for uniqueness across pending and mined transactions.

### Medium Priority

#### Transaction payload validation is incomplete

The API only checks that `payload` is an object. It does not require type-specific fields. For example, a vaccination transaction with an empty payload can pass the basic validation. Each transaction type should have a schema; a vaccination should require fields such as `vaccine` and `occasion`.

#### Timestamps are not validated

Transaction timestamps only need to be non-empty strings. Invalid dates, dates far in the future, or dates unrelated to the request can be submitted. Timestamps should be validated as ISO 8601 values, and the application should decide whether timestamps come from the client or the server.

#### SQLite foreign keys are not enabled

The schema declares a foreign key from `journal_entries.horse_id` to `horses.id`, but SQLite does not enforce foreign keys unless `PRAGMA foreign_keys = ON` is enabled for the connection. The service layer checks that horses exist, but the database should enforce the relationship as well.

#### No rate limiting

The transaction and mining endpoints have no request throttling. Without authentication or rate limiting, a client can submit large numbers of requests and consume CPU or memory. Add rate limiting before deploying the API publicly.

#### Input lengths are not bounded explicitly

Several string fields only check that they are non-empty. Maximum lengths should be defined for IDs, names, owners, notes, timestamps, and transaction payload values to prevent oversized records and simplify database operations.

### Lower Priority and Operational Risks

#### No explicit JSON body limit

`express.json()` is used without an application-specific size limit. Express has a default limit, but the API should set and document an intentional limit, such as `10kb`, based on the expected payload size.

#### Limited transaction-type rules

The current mating rule rejects any second mating transaction for the same horse. If the real requirement is to reject only overlapping mating periods, the payload needs date-range fields and overlap validation.

#### No graceful shutdown handling

The server does not explicitly close the database or preserve pending blockchain transactions during shutdown. A graceful shutdown handler should close resources cleanly and define what happens to pending work.

#### Test coverage does not include the main risks

The existing tests cover the current API and business rules, but do not yet cover authentication, restart persistence, duplicate transaction IDs, malformed transaction payloads, foreign-key enforcement, rate limiting, or high mining difficulty.

### Review Notes

- The models use parameterized SQL queries, so the current code does not show an obvious SQL injection issue.
- The database path comes from server configuration, not from an API request, so it is not currently a user-controlled path traversal vulnerability.
- The current service has no horse-delete endpoint, so a previously reported validation race involving deleting a horse during transaction submission is not an active route-level issue.

### Recommended Order of Improvements

1. Add authentication and authorization.
2. Persist the blockchain in SQLite or another durable store.
3. Enforce unique transaction IDs and type-specific payload schemas.
4. Enable SQLite foreign keys and add explicit input-size limits.
5. Move mining off the request thread and add rate limiting.
6. Add tests for restart behavior, malformed input, duplicates, and abuse scenarios.
