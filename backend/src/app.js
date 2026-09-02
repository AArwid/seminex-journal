import express from "express";
import { createJournalRoutes } from "./routes/journalRoutes.js";
import { createHorseRoutes } from "./routes/horseRoutes.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp({
  journalService,
  horseService,
  journalEntryService,
}) {
  const app = express();
  app.use(express.json());
  app.use("/api", createJournalRoutes(journalService));
  if (horseService) {
    app.use(
      "/api/horses",
      createHorseRoutes(horseService, journalEntryService),
    );
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
