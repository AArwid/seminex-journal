import { describe, it, expect, beforeEach } from "vitest";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { JournalModel } from "../../src/models/JournalModel.js";
import { JournalEntryService } from "../../src/services/JournalEntryService.js";
import { BadRequestError, NotFoundError } from "../../src/errors.js";

describe("JournalEntryService", () => {
  let service;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    new HorseModel(db).create({ id: "h1", name: "Thunder", owner: "Anna" });
    service = new JournalEntryService(new JournalModel(db), new HorseModel(db));
  });

  it("adds a journal entry for a registered horse", () => {
    const entry = service.create("h1", {
      note: "Routine checkup, healthy.",
      author: "Vet Lisa",
    });
    expect(entry).toMatchObject({
      horseId: "h1",
      note: "Routine checkup, healthy.",
    });
  });

  it("throws NotFoundError when adding an entry for an unknown horse", () => {
    expect(() =>
      service.create("unknown", { note: "Checkup", author: "Vet Lisa" }),
    ).toThrow(NotFoundError);
  });

  it("rejects an entry with an empty note", () => {
    expect(() =>
      service.create("h1", { note: "", author: "Vet Lisa" }),
    ).toThrow(BadRequestError);
  });

  it("lists journal entries for a horse", () => {
    service.create("h1", { note: "First", author: "Vet Lisa" });
    service.create("h1", { note: "Second", author: "Vet Lisa" });
    expect(service.listByHorse("h1")).toHaveLength(2);
  });

  it("throws NotFoundError when listing entries for an unknown horse", () => {
    expect(() => service.listByHorse("unknown")).toThrow(NotFoundError);
  });
});
