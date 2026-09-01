import { describe, it, expect, beforeEach } from "vitest";
import { Blockchain } from "../../src/engine/Blockchain.js";
import { createDatabase } from "../../src/models/db.js";
import { HorseModel } from "../../src/models/HorseModel.js";
import { JournalService } from "../../src/services/JournalService.js";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors.js";

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

describe("JournalService", () => {
  let service;
  let horseModel;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    horseModel = new HorseModel(db);
    horseModel.create({ id: "h1", name: "Thunder", owner: "Anna" });
    const blockchain = new Blockchain({ difficulty: 1 });
    service = new JournalService(blockchain, horseModel);
  });

  it("submits a valid transaction referencing a registered horse", () => {
    service.submitTransaction(validTransaction());
    expect(service.getChainState().pendingTransactions).toHaveLength(1);
  });

  it("rejects a transaction referencing an unknown horse with 422", () => {
    expect(() =>
      service.submitTransaction(validTransaction({ horseId: "unknown" })),
    ).toThrow(UnprocessableEntityError);
  });

  it("rejects a malformed transaction with 400", () => {
    expect(() => service.submitTransaction({ type: "vaccination" })).toThrow(
      BadRequestError,
    );
  });

  it("mines pending transactions into a new block", () => {
    service.submitTransaction(validTransaction());
    const block = service.mine();
    expect(block.data).toEqual([validTransaction()]);
    expect(service.getChainState().pendingTransactions).toHaveLength(0);
  });

  it("throws NotFoundError when getting history for an unknown horse", () => {
    expect(() => service.getHorseHistory("unknown")).toThrow(NotFoundError);
  });

  it("returns history and derived status for a known horse", () => {
    service.submitTransaction(validTransaction());
    service.mine();
    const result = service.getHorseHistory("h1");
    expect(result.horse).toMatchObject({ id: "h1", name: "Thunder" });
    expect(result.history).toEqual([validTransaction()]);
    expect(result.status.isVaccinated).toBe(true);
  });
});
