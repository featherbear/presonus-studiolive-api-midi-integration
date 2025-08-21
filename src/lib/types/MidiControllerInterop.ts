import z from "zod";

export const MidiControllerInteropNoConfig = z.object({
  id: z.string(),
  type: z.string(),
  consoleId: z.string(),
  midiConnectionId: z.string(),
});
export type MidiControllerInteropNoConfig = z.infer<typeof MidiControllerInteropNoConfig>;

export const MidiControllerInterop = MidiControllerInteropNoConfig.extend({
  config: z.any().optional(),
});

export type MidiControllerInterop = z.infer<typeof MidiControllerInterop>;
