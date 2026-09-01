import { describe, it, expect, beforeEach } from "vitest";
import { Blockchain } from "../../src/engine/Blockchain.js";

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

describe("Blockchain", () => {
  let chain;

  beforeEach(() => {
    chain = new Blockchain({ difficulty: 1 });
  });

  it("creates a hardcoded genesis block on initialization", () => {
    expect(chain.chain).toHaveLength(1);
    expect(chain.chain[0].index).toBe(0);
    expect(chain.chain[0].previousHash).toBe("0");
  });

  it("adds a valid transaction to the pending pool", () => {
    chain.addTransaction(validTransaction());
    expect(chain.pendingTransactions).toHaveLength(1);
  });

  it("rejects a transaction missing required fields", () => {
    expect(() => chain.addTransaction({ type: "vaccination" })).toThrow();
    expect(chain.pendingTransactions).toHaveLength(0);
  });

  it("rejects a duplicate vaccination for the same horse, vaccine and occasion", () => {
    chain.addTransaction(validTransaction());
    chain.minePendingTransactions();
    expect(() =>
      chain.addTransaction(validTransaction({ id: "tx-2" })),
    ).toThrow();
  });

  it("mines pending transactions into a new block and clears the pool", () => {
    chain.addTransaction(validTransaction());
    const block = chain.minePendingTransactions();
    expect(chain.chain).toHaveLength(2);
    expect(block.data).toEqual([validTransaction()]);
    expect(chain.pendingTransactions).toHaveLength(0);
  });

  it("mines a block whose hash respects the configured difficulty", () => {
    chain.addTransaction(validTransaction());
    const block = chain.minePendingTransactions();
    expect(block.hash.startsWith("0".repeat(chain.difficulty))).toBe(true);
  });

  it("is valid immediately after mining", () => {
    chain.addTransaction(validTransaction());
    chain.minePendingTransactions();
    expect(chain.isChainValid()).toBe(true);
  });

  it("detects tampered block data", () => {
    chain.addTransaction(validTransaction());
    chain.minePendingTransactions();
    chain.chain[1].data = [validTransaction({ horseId: "tampered" })];
    expect(chain.isChainValid()).toBe(false);
  });

  it("detects a broken previousHash link", () => {
    chain.addTransaction(validTransaction());
    chain.minePendingTransactions();
    chain.addTransaction(
      validTransaction({ id: "tx-3", horseId: "h2", type: "mating" }),
    );
    chain.minePendingTransactions();
    chain.chain[2].previousHash = "broken";
    expect(chain.isChainValid()).toBe(false);
  });

  it("rejects a mating that conflicts with an already approved event", () => {
    chain.addTransaction(
      validTransaction({ id: "tx-4", type: "mating", horseId: "h1" }),
    );
    chain.minePendingTransactions();
    expect(() =>
      chain.addTransaction(
        validTransaction({ id: "tx-5", type: "mating", horseId: "h1" }),
      ),
    ).toThrow();
  });
});
