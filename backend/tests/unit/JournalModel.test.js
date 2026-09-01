import { describe, it, expect, beforeEach } from "vitest";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { JournalModel } from "../../src/models/JournalModel.js";

describe("JournalModel", () => {
  let db;
  let journalModel;

  beforeEach(() => {
    db = createDatabase(":memory:");
    new HorseModel(db).create({ id: "h1", name: "Thunder", owner: "Anna" });
    journalModel = new JournalModel(db);
  });

  it("adds a journal entry for a horse", () => {
    journalModel.create({
      horseId: "h1",
      note: "Routine checkup, healthy.",
      author: "Vet Lisa",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const entries = journalModel.listByHorse("h1");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      horseId: "h1",
      note: "Routine checkup, healthy.",
      author: "Vet Lisa",
    });
  });

  it("returns an empty list for a horse without journal entries", () => {
    expect(journalModel.listByHorse("unknown")).toEqual([]);
  });

  it("lists journal entries ordered by creation time", () => {
    journalModel.create({
      horseId: "h1",
      note: "Second",
      author: "Vet Lisa",
      createdAt: "2026-01-02T00:00:00.000Z",
    });
    journalModel.create({
      horseId: "h1",
      note: "First",
      author: "Vet Lisa",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const entries = journalModel.listByHorse("h1");
    expect(entries.map((entry) => entry.note)).toEqual(["First", "Second"]);
  });
});
