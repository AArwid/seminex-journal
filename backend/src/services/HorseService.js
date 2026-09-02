import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "../errors.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

export class HorseService {
  constructor(horseModel) {
    this.horseModel = horseModel;
  }

  create(horse) {
    if (
      !horse ||
      !isNonEmptyString(horse.id) ||
      !isNonEmptyString(horse.name)
    ) {
      throw new BadRequestError("Invalid horse: id and name are required");
    }
    if (this.horseModel.getById(horse.id)) {
      throw new UnprocessableEntityError(`Horse already exists: ${horse.id}`);
    }
    return this.horseModel.create(horse);
  }

  list() {
    return this.horseModel.list();
  }

  getById(id) {
    const horse = this.horseModel.getById(id);
    if (!horse) {
      throw new NotFoundError(`Horse not found: ${id}`);
    }
    return horse;
  }

  updateOwner(id, owner) {
    this.getById(id);
    if (!isNonEmptyString(owner)) {
      throw new BadRequestError("Invalid owner: must be a non-empty string");
    }
    return this.horseModel.updateOwner(id, owner);
  }
}
