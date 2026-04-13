import type { ConsoleConnectionInterop } from "./ConsoleConnectionInterop";
import type { MidiConnectionInterop } from "./MidiConnectionInterop";
import type { DeviceControllerInteropWithConfig } from "./DeviceControllerInterop";

export type AppSettings = {
  midi: {
    connections: Record<string, MidiConnectionInterop>;
    controllers: Record<string, DeviceControllerInteropWithConfig>;
  };
  consoles: Record<string, ConsoleConnectionInterop>;
};
