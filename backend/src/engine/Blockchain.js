import { Block } from "./Block.js";

const GENESIS_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

export class Blockchain {
  constructor({ difficulty } = {}) {
    this.difficulty = difficulty ?? Number(process.env.POW_DIFFICULTY) ?? 1;
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
  }

  createGenesisBlock() {
    return new Block(0, GENESIS_TIMESTAMP, { type: "genesis" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getMinedTransactions() {
    return this.chain
      .slice(1)
      .flatMap((block) => (Array.isArray(block.data) ? block.data : []));
  }

  validateTransaction(transaction) {
    if (
      !transaction ||
      !isNonEmptyString(transaction.id) ||
      !isNonEmptyString(transaction.horseId) ||
      !isNonEmptyString(transaction.type) ||
      !isNonEmptyString(transaction.timestamp) ||
      typeof transaction.payload !== "object" ||
      transaction.payload === null
    ) {
      throw new Error("Invalid transaction: missing required fields");
    }

    const minedTransactions = this.getMinedTransactions();

    if (transaction.type === "vaccination") {
      const duplicate = minedTransactions.some(
        (tx) =>
          tx.type === "vaccination" &&
          tx.horseId === transaction.horseId &&
          tx.payload?.vaccine === transaction.payload?.vaccine &&
          tx.payload?.occasion === transaction.payload?.occasion,
      );
      if (duplicate) {
        throw new Error(
          "Duplicate vaccination for this horse, vaccine and occasion",
        );
      }
    }

    if (transaction.type === "mating") {
      const conflict = minedTransactions.some(
        (tx) => tx.type === "mating" && tx.horseId === transaction.horseId,
      );
      if (conflict) {
        throw new Error(
          "Conflicting mating event already approved for this horse",
        );
      }
    }
  }

  addTransaction(transaction) {
    this.validateTransaction(transaction);
    this.pendingTransactions.push(transaction);
    return transaction;
  }

  minePendingTransactions() {
    const block = new Block(
      this.chain.length,
      new Date().toISOString(),
      this.pendingTransactions,
      this.getLatestBlock().hash,
    );
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i += 1) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}
