import z from "zod";

export const MidiConnectionInterop = z.object({
  id: z.string(),
  name: z.string(),
  input: z.string(),
  output: z.string().optional(),
});

export type MidiConnectionInterop = z.infer<typeof MidiConnectionInterop>;
