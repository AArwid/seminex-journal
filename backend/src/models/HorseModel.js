function toHorse(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    birthDate: row.birth_date,
    owner: row.owner,
    motherId: row.mother_id,
    fatherId: row.father_id,
  };
}

export class HorseModel {
  constructor(db) {
    this.db = db;
  }

  create(horse) {
    this.db
      .prepare(
        `INSERT INTO horses (id, name, breed, birth_date, owner, mother_id, father_id)
         VALUES (@id, @name, @breed, @birthDate, @owner, @motherId, @fatherId)`,
      )
      .run({
        breed: null,
        birthDate: null,
        owner: null,
        motherId: null,
        fatherId: null,
        ...horse,
      });
    return this.getById(horse.id);
  }

  getById(id) {
    const row = this.db.prepare("SELECT * FROM horses WHERE id = ?").get(id);
    return toHorse(row);
  }

  list() {
    return this.db.prepare("SELECT * FROM horses").all().map(toHorse);
  }

  updateOwner(id, owner) {
    this.db.prepare("UPDATE horses SET owner = ? WHERE id = ?").run(owner, id);
    return this.getById(id);
  }
}
