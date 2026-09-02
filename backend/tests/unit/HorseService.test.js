import { describe, it, expect, beforeEach } from "vitest";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { HorseService } from "../../src/services/HorseService.js";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors.js";

function validHorse(overrides = {}) {
  return {
    id: "h1",
    name: "Thunder",
    breed: "Arabian",
    birthDate: "2020-05-01",
    owner: "Anna",
    ...overrides,
  };
}

describe("HorseService", () => {
  let service;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    service = new HorseService(new HorseModel(db));
  });

  it("creates a horse profile", () => {
    const horse = service.create(validHorse());
    expect(horse).toMatchObject({ id: "h1", name: "Thunder" });
  });

  it("rejects creation with a missing name", () => {
    expect(() => service.create({ id: "h1" })).toThrow(BadRequestError);
  });

  it("rejects creation with a duplicate id", () => {
    service.create(validHorse());
    expect(() => service.create(validHorse())).toThrow(
      UnprocessableEntityError,
    );
  });

  it("returns a horse by id", () => {
    service.create(validHorse());
    expect(service.getById("h1")).toMatchObject({ name: "Thunder" });
  });

  it("throws NotFoundError for an unknown horse id", () => {
    expect(() => service.getById("unknown")).toThrow(NotFoundError);
  });

  it("lists all horses", () => {
    service.create(validHorse());
    service.create(validHorse({ id: "h2", name: "Storm" }));
    expect(service.list()).toHaveLength(2);
  });

  it("updates the owner of an existing horse", () => {
    service.create(validHorse());
    const updated = service.updateOwner("h1", "Erik");
    expect(updated.owner).toBe("Erik");
  });

  it("throws NotFoundError when updating owner of an unknown horse", () => {
    expect(() => service.updateOwner("unknown", "Erik")).toThrow(NotFoundError);
  });
});
