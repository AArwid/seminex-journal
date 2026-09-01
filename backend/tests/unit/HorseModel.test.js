import { describe, it, expect, beforeEach } from "vitest";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";

function validHorse(overrides = {}) {
  return {
    id: "h1",
    name: "Thunder",
    breed: "Arabian",
    birthDate: "2020-05-01",
    owner: "Anna",
    motherId: null,
    fatherId: null,
    ...overrides,
  };
}

describe("HorseModel", () => {
  let db;
  let horseModel;

  beforeEach(() => {
    db = createDatabase(":memory:");
    horseModel = new HorseModel(db);
  });

  it("creates a horse profile and retrieves it by id", () => {
    horseModel.create(validHorse());
    const horse = horseModel.getById("h1");
    expect(horse).toMatchObject({ id: "h1", name: "Thunder", owner: "Anna" });
  });

  it("returns undefined for an unknown horse id", () => {
    expect(horseModel.getById("missing")).toBeUndefined();
  });

  it("lists all horse profiles", () => {
    horseModel.create(validHorse());
    horseModel.create(validHorse({ id: "h2", name: "Storm" }));
    const horses = horseModel.list();
    expect(horses).toHaveLength(2);
  });

  it("updates the owner of a horse profile", () => {
    horseModel.create(validHorse());
    horseModel.updateOwner("h1", "Erik");
    expect(horseModel.getById("h1").owner).toBe("Erik");
  });

  it("stores pedigree references to mother and father", () => {
    horseModel.create(validHorse());
    horseModel.create(validHorse({ id: "h2", name: "Storm" }));
    horseModel.create(
      validHorse({ id: "h3", name: "Foal", motherId: "h1", fatherId: "h2" }),
    );
    const foal = horseModel.getById("h3");
    expect(foal.motherId).toBe("h1");
    expect(foal.fatherId).toBe("h2");
  });
});
