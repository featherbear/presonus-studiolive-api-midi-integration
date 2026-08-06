import z from "zod";

export const DeviceControllerInterop = z.object({
  id: z.string(),
  type: z.string(),
  consoleId: z.string(),
  midiConnectionId: z.string(),
});
export type DeviceControllerInterop = z.infer<typeof DeviceControllerInterop>;

export const DeviceControllerInteropWithConfig = DeviceControllerInterop.extend({
  config: z.any().optional(),
});

export type DeviceControllerInteropWithConfig = z.infer<typeof DeviceControllerInteropWithConfig>;
