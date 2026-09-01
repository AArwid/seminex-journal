import Database from "better-sqlite3";

function applyMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS horses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      breed TEXT,
      birth_date TEXT,
      owner TEXT,
      mother_id TEXT,
      father_id TEXT
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      horse_id TEXT NOT NULL REFERENCES horses(id),
      note TEXT NOT NULL,
      author TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

export function createDatabase(path) {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  applyMigrations(db);
  return db;
}
