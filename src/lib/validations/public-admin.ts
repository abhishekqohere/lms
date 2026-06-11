import { z } from "zod";

export const publicAdminDiagnosticsSchema = z.object({
  sessionId: z.string().optional(),
  includePII: z.coerce.boolean().optional(),
  role: z.enum(["admin", "instructor", "student"]).optional(),
});

export type PublicAdminDiagnosticsInput = z.infer<
  typeof publicAdminDiagnosticsSchema
>;
