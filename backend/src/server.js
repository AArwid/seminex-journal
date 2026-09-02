import "dotenv/config";
import { createApp } from "./app.js";
import { Blockchain } from "./engine/Blockchain.js";
import { createDatabase } from "./models/db.js";
import { HorseModel } from "./models/HorseModel.js";
import { JournalModel } from "./models/JournalModel.js";
import { JournalService } from "./services/JournalService.js";
import { HorseService } from "./services/HorseService.js";
import { JournalEntryService } from "./services/JournalEntryService.js";

const port = process.env.PORT ?? 3000;
const databasePath = process.env.DATABASE_PATH ?? "./data/seminex-journal.db";

const db = createDatabase(databasePath);
const horseModel = new HorseModel(db);
const journalModel = new JournalModel(db);
const blockchain = new Blockchain();
const journalService = new JournalService(blockchain, horseModel);
const horseService = new HorseService(horseModel);
const journalEntryService = new JournalEntryService(journalModel, horseModel);

const app = createApp({ journalService, horseService, journalEntryService });

app.listen(port, () => {
  console.log(`Seminex Journal API listening on port ${port}`);
});
