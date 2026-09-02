import "dotenv/config";
import { createDatabase } from "../src/models/db.js";
import { HorseModel } from "../src/models/HorseModel.js";
import { JournalModel } from "../src/models/JournalModel.js";

const databasePath = process.env.DATABASE_PATH ?? "./data/seminex-journal.db";
const db = createDatabase(databasePath);
const horseModel = new HorseModel(db);
const journalModel = new JournalModel(db);

const sampleHorses = [
  {
    id: "h1",
    name: "Thunder",
    breed: "Arabian",
    birthDate: "2020-05-01",
    owner: "Anna",
  },
  {
    id: "h2",
    name: "Storm",
    breed: "Warmblood",
    birthDate: "2019-03-12",
    owner: "Erik",
  },
  {
    id: "h3",
    name: "Foal",
    breed: "Arabian",
    birthDate: "2024-06-20",
    owner: "Anna",
    motherId: "h1",
    fatherId: "h2",
  },
  {
    id: "h4",
    name: "Blaze",
    breed: "Icelandic",
    birthDate: "2018-07-09",
    owner: "Erik",
  },
  {
    id: "h5",
    name: "Willow",
    breed: "Warmblood",
    birthDate: "2021-04-15",
    owner: "Maria",
  },
  {
    id: "h6",
    name: "Comet",
    breed: "Arabian",
    birthDate: "2022-02-28",
    owner: "Maria",
    motherId: "h5",
    fatherId: "h1",
  },
  {
    id: "h7",
    name: "Luna",
    breed: "Icelandic",
    birthDate: "2017-11-03",
    owner: "Anna",
  },
];

const sampleJournalEntry = {
  horseId: "h1",
  note: "Routine checkup, healthy.",
  author: "Vet Lisa",
  createdAt: "2026-01-01T00:00:00.000Z",
};

for (const horse of sampleHorses) {
  if (horseModel.getById(horse.id)) {
    console.log(`Skipped existing horse: ${horse.id}`);
    continue;
  }
  horseModel.create(horse);
  console.log(`Seeded horse: ${horse.id}`);
}

if (journalModel.listByHorse(sampleJournalEntry.horseId).length === 0) {
  journalModel.create(sampleJournalEntry);
  console.log(`Seeded journal entry for ${sampleJournalEntry.horseId}`);
} else {
  console.log(
    `Skipped seeding journal entry for ${sampleJournalEntry.horseId} (entries already exist)`,
  );
}

console.log(`Seed complete: ${databasePath}`);
