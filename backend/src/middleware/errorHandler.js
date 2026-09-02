import { AppError } from "../errors.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
