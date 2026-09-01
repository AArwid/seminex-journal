import { NotFoundError, UnprocessableEntityError } from "../errors.js";

export class JournalService {
  constructor(blockchain, horseModel) {
    this.blockchain = blockchain;
    this.horseModel = horseModel;
  }

  submitTransaction(transaction) {
    this.blockchain.validateTransaction(transaction);
    if (!this.horseModel.getById(transaction.horseId)) {
      throw new UnprocessableEntityError(
        `Unknown horse: ${transaction.horseId}`,
      );
    }
    return this.blockchain.addTransaction(transaction);
  }

  mine() {
    return this.blockchain.minePendingTransactions();
  }

  getChainState() {
    return {
      chain: this.blockchain.chain,
      pendingTransactions: this.blockchain.pendingTransactions,
    };
  }

  getHorseHistory(horseId) {
    const horse = this.horseModel.getById(horseId);
    if (!horse) {
      throw new NotFoundError(`Horse not found: ${horseId}`);
    }

    const history = this.blockchain
      .getMinedTransactions()
      .filter((tx) => tx.horseId === horseId);
    const pendingTransactions = this.blockchain.pendingTransactions.filter(
      (tx) => tx.horseId === horseId,
    );

    return {
      horse,
      history,
      pendingTransactions,
      status: {
        isVaccinated: history.some((tx) => tx.type === "vaccination"),
        approvedMatings: history.filter((tx) => tx.type === "mating").length,
      },
    };
  }
}
