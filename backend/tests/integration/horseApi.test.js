import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { Blockchain } from "../../src/engine/Blockchain.js";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { JournalModel } from "../../src/models/JournalModel.js";
import { JournalService } from "../../src/services/JournalService.js";
import { HorseService } from "../../src/services/HorseService.js";
import { JournalEntryService } from "../../src/services/JournalEntryService.js";

function validHorse(overrides = {}) {
  return {
    id: "h1",
    name: "Thunder",
    breed: "Arabian",
    owner: "Anna",
    ...overrides,
  };
}

describe("Horse & journal entry API", () => {
  let app;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    const horseModel = new HorseModel(db);
    const journalModel = new JournalModel(db);
    const blockchain = new Blockchain({ difficulty: 1 });
    app = createApp({
      journalService: new JournalService(blockchain, horseModel),
      horseService: new HorseService(horseModel),
      journalEntryService: new JournalEntryService(journalModel, horseModel),
    });
  });

  it("POST /api/horses creates a horse profile", async () => {
    const res = await request(app).post("/api/horses").send(validHorse());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "h1", name: "Thunder" });
  });

  it("POST /api/horses returns 400 for a missing name", async () => {
    const res = await request(app).post("/api/horses").send({ id: "h1" });
    expect(res.status).toBe(400);
  });

  it("POST /api/horses returns 422 for a duplicate id", async () => {
    await request(app).post("/api/horses").send(validHorse());
    const res = await request(app).post("/api/horses").send(validHorse());
    expect(res.status).toBe(422);
  });

  it("GET /api/horses lists all horses", async () => {
    await request(app).post("/api/horses").send(validHorse());
    const res = await request(app).get("/api/horses");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("GET /api/horses/:id returns a single horse", async () => {
    await request(app).post("/api/horses").send(validHorse());
    const res = await request(app).get("/api/horses/h1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "h1" });
  });

  it("GET /api/horses/:id returns 404 for an unknown horse", async () => {
    const res = await request(app).get("/api/horses/unknown");
    expect(res.status).toBe(404);
  });

  it("PATCH /api/horses/:id/owner updates the owner", async () => {
    await request(app).post("/api/horses").send(validHorse());
    const res = await request(app)
      .patch("/api/horses/h1/owner")
      .send({ owner: "Erik" });
    expect(res.status).toBe(200);
    expect(res.body.owner).toBe("Erik");
  });

  it("POST /api/horses/:id/journal-entries adds an entry", async () => {
    await request(app).post("/api/horses").send(validHorse());
    const res = await request(app)
      .post("/api/horses/h1/journal-entries")
      .send({ note: "Routine checkup", author: "Vet Lisa" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ horseId: "h1", note: "Routine checkup" });
  });

  it("POST /api/horses/:id/journal-entries returns 404 for an unknown horse", async () => {
    const res = await request(app)
      .post("/api/horses/unknown/journal-entries")
      .send({ note: "Routine checkup" });
    expect(res.status).toBe(404);
  });

  it("GET /api/horses/:id/journal-entries lists entries", async () => {
    await request(app).post("/api/horses").send(validHorse());
    await request(app)
      .post("/api/horses/h1/journal-entries")
      .send({ note: "Routine checkup" });
    const res = await request(app).get("/api/horses/h1/journal-entries");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
