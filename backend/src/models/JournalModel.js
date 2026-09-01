function toJournalEntry(row) {
  return {
    id: row.id,
    horseId: row.horse_id,
    note: row.note,
    author: row.author,
    createdAt: row.created_at,
  };
}

export class JournalModel {
  constructor(db) {
    this.db = db;
  }

  create(entry) {
    const result = this.db
      .prepare(
        `INSERT INTO journal_entries (horse_id, note, author, created_at)
         VALUES (@horseId, @note, @author, @createdAt)`,
      )
      .run(entry);
    return toJournalEntry(
      this.db
        .prepare("SELECT * FROM journal_entries WHERE id = ?")
        .get(result.lastInsertRowid),
    );
  }

  listByHorse(horseId) {
    return this.db
      .prepare(
        "SELECT * FROM journal_entries WHERE horse_id = ? ORDER BY created_at ASC",
      )
      .all(horseId)
      .map(toJournalEntry);
  }
}
