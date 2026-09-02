export function createJournalController(journalService) {
  return {
    getChain(req, res) {
      res.json(journalService.getChainState());
    },

    postTransaction(req, res, next) {
      try {
        const transaction = journalService.submitTransaction(req.body);
        res.status(201).json(transaction);
      } catch (err) {
        next(err);
      }
    },

    mine(req, res, next) {
      try {
        const block = journalService.mine();
        res.status(201).json(block);
      } catch (err) {
        next(err);
      }
    },

    verify(req, res, next) {
      try {
        const result = journalService.getHorseHistory(req.params.id);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
