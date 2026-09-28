import { ZodError } from "zod";

/**
 * Factory: returns Express middleware that validates req.body against
 * the given Zod schema. If validation fails, responds with 400.
 *
 * Usage:
 *   import { z } from "zod";
 *   const schema = z.object({ email: z.string().email() });
 *   router.post("/", validate(schema), controller);
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

/**
 * Validate query parameters against a Zod schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
