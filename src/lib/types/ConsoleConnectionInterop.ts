import z from "zod";

// FIXME: Expose ConnectionAddress
import type { SimpleClient } from "presonus-studiolive-api/simple";

export const ConsoleConnectionInterop = z.object({
  id: z.string(),
  name: z.string(),
  address: z.object({
    host: z.string(),
    port: z.number().min(1).max(65535).optional().default(53000),
  }) satisfies z.ZodType<ConstructorParameters<typeof SimpleClient>[0]>,
});

export type ConsoleConnectionInterop = z.infer<typeof ConsoleConnectionInterop>;
