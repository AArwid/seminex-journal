import { describe, it, expect } from "vitest";
import { Block } from "../../src/engine/Block.js";

describe("Block", () => {
  const baseData = { type: "vaccination", horseId: "h1" };

  it("calculates a hash based on index, timestamp, data, previousHash and nonce", () => {
    const block = new Block(0, "2026-01-01T00:00:00.000Z", baseData, "0");
    expect(block.hash).toBe(block.calculateHash());
    expect(typeof block.hash).toBe("string");
    expect(block.hash.length).toBeGreaterThan(0);
  });

  it("produces a different hash when the nonce changes", () => {
    const block = new Block(0, "2026-01-01T00:00:00.000Z", baseData, "0");
    const originalHash = block.hash;
    block.nonce += 1;
    expect(block.calculateHash()).not.toBe(originalHash);
  });

  it("produces a different hash when the data changes", () => {
    const block = new Block(0, "2026-01-01T00:00:00.000Z", baseData, "0");
    const originalHash = block.hash;
    block.data = { ...baseData, horseId: "h2" };
    expect(block.calculateHash()).not.toBe(originalHash);
  });

  it("serializes data deterministically regardless of key order", () => {
    const blockA = new Block(
      0,
      "2026-01-01T00:00:00.000Z",
      { a: 1, b: 2 },
      "0",
    );
    const blockB = new Block(
      0,
      "2026-01-01T00:00:00.000Z",
      { b: 2, a: 1 },
      "0",
    );
    expect(blockA.calculateHash()).toBe(blockB.calculateHash());
  });

  it("mines a block so the hash starts with the required number of leading zeros", () => {
    const block = new Block(0, "2026-01-01T00:00:00.000Z", baseData, "0");
    const difficulty = 2;
    block.mineBlock(difficulty);
    expect(block.hash.startsWith("0".repeat(difficulty))).toBe(true);
    expect(block.hash).toBe(block.calculateHash());
  });
});
