import { Router } from "express";
import { createJournalController } from "../controllers/journalController.js";

export function createJournalRoutes(journalService) {
  const router = Router();
  const controller = createJournalController(journalService);

  router.get("/chain", controller.getChain);
  router.post("/transactions", controller.postTransaction);
  router.post("/mine", controller.mine);
  router.get("/verify/:id", controller.verify);

  return router;
}
