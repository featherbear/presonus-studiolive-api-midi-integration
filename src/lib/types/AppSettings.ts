import type { ConsoleConnectionInterop } from "./ConsoleConnectionInterop";
import type { MidiConnectionInterop } from "./MidiConnectionInterop";
import type { MidiControllerInterop } from "./MidiControllerInterop";

export type AppSettings = {
  midi: {
    connections: Record<string, MidiConnectionInterop>;
    controllers: Record<string, MidiControllerInterop>;
  };
  consoles: Record<string, ConsoleConnectionInterop>;
};
