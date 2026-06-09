import type { ZodError } from "zod";

export function getValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Validation error";
}
