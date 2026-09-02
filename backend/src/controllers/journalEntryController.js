export function createJournalEntryController(journalEntryService) {
  return {
    create(req, res, next) {
      try {
        const entry = journalEntryService.create(req.params.horseId, req.body);
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },

    listByHorse(req, res, next) {
      try {
        res.json(journalEntryService.listByHorse(req.params.horseId));
      } catch (err) {
        next(err);
      }
    },
  };
}
