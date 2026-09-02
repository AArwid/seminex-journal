import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { Blockchain } from "../../src/engine/Blockchain.js";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { JournalService } from "../../src/services/JournalService.js";

function validTransaction(overrides = {}) {
  return {
    id: "tx-1",
    horseId: "h1",
    type: "vaccination",
    timestamp: "2026-01-01T00:00:00.000Z",
    payload: { vaccine: "flu", occasion: "2026-01-01" },
    ...overrides,
  };
}

describe("Journal API", () => {
  let app;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    const horseModel = new HorseModel(db);
    horseModel.create({ id: "h1", name: "Thunder", owner: "Anna" });
    const blockchain = new Blockchain({ difficulty: 1 });
    const journalService = new JournalService(blockchain, horseModel);
    app = createApp({ journalService });
  });

  it("GET /api/chain returns the genesis block and empty pending pool", async () => {
    const res = await request(app).get("/api/chain");
    expect(res.status).toBe(200);
    expect(res.body.chain).toHaveLength(1);
    expect(res.body.pendingTransactions).toEqual([]);
  });

  it("POST /api/transactions adds a valid transaction to the pending pool", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send(validTransaction());
    expect(res.status).toBe(201);

    const chainRes = await request(app).get("/api/chain");
    expect(chainRes.body.pendingTransactions).toHaveLength(1);
  });

  it("POST /api/transactions returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Content-Type", "application/json")
      .send("{ invalid json");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/transactions returns 422 for an unknown horse", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send(validTransaction({ horseId: "unknown" }));
    expect(res.status).toBe(422);
  });

  it("POST /api/mine mines pending transactions into a new block", async () => {
    await request(app).post("/api/transactions").send(validTransaction());
    const res = await request(app).post("/api/mine");
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual([validTransaction()]);
  });

  it("GET /api/verify/:id returns history and derived status for a known horse", async () => {
    await request(app).post("/api/transactions").send(validTransaction());
    await request(app).post("/api/mine");
    const res = await request(app).get("/api/verify/h1");
    expect(res.status).toBe(200);
    expect(res.body.status.isVaccinated).toBe(true);
  });

  it("GET /api/verify/:id returns 404 for an unknown horse", async () => {
    const res = await request(app).get("/api/verify/unknown");
    expect(res.status).toBe(404);
  });

  it("returns 404 JSON for unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
