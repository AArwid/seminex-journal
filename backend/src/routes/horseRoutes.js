import { Router } from "express";
import { createHorseController } from "../controllers/horseController.js";
import { createJournalEntryController } from "../controllers/journalEntryController.js";

export function createHorseRoutes(horseService, journalEntryService) {
  const router = Router();
  const horseController = createHorseController(horseService);
  const journalEntryController =
    createJournalEntryController(journalEntryService);

  router.post("/", horseController.create);
  router.get("/", horseController.list);
  router.get("/:id", horseController.getById);
  router.patch("/:id/owner", horseController.updateOwner);

  router.post("/:horseId/journal-entries", journalEntryController.create);
  router.get("/:horseId/journal-entries", journalEntryController.listByHorse);

  return router;
}
