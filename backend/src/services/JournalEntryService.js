import { BadRequestError, NotFoundError } from "../errors.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

export class JournalEntryService {
  constructor(journalModel, horseModel) {
    this.journalModel = journalModel;
    this.horseModel = horseModel;
  }

  assertHorseExists(horseId) {
    if (!this.horseModel.getById(horseId)) {
      throw new NotFoundError(`Horse not found: ${horseId}`);
    }
  }

  create(horseId, entry) {
    this.assertHorseExists(horseId);
    if (!isNonEmptyString(entry?.note)) {
      throw new BadRequestError("Invalid journal entry: note is required");
    }
    return this.journalModel.create({
      horseId,
      note: entry.note,
      author: entry.author ?? null,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    });
  }

  listByHorse(horseId) {
    this.assertHorseExists(horseId);
    return this.journalModel.listByHorse(horseId);
  }
}
