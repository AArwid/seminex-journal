import { createHash } from "node:crypto";

// Deterministic JSON stringify: sorts object keys recursively for stable hashing.
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export class Block {
  constructor(index, timestamp, data, previousHash = "", nonce = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return createHash("sha256")
      .update(
        `${this.index}${this.timestamp}${stableStringify(this.data)}${this.previousHash}${this.nonce}`,
      )
      .digest("hex");
  }

  mineBlock(difficulty) {
    const target = "0".repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce += 1;
      this.hash = this.calculateHash();
    }
    return this.hash;
  }
}
