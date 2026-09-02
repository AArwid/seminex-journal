export function createHorseController(horseService) {
  return {
    create(req, res, next) {
      try {
        const horse = horseService.create(req.body);
        res.status(201).json(horse);
      } catch (err) {
        next(err);
      }
    },

    list(req, res) {
      res.json(horseService.list());
    },

    getById(req, res, next) {
      try {
        res.json(horseService.getById(req.params.id));
      } catch (err) {
        next(err);
      }
    },

    updateOwner(req, res, next) {
      try {
        const horse = horseService.updateOwner(req.params.id, req.body?.owner);
        res.json(horse);
      } catch (err) {
        next(err);
      }
    },
  };
}
