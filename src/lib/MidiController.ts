import { nanoid } from "nanoid";
import type { MidiDevice } from "./MidiDevice";
import type { MidiConnection } from "./MidiConnection";
import type { MidiControllerInterop } from "./types/MidiControllerInterop";
import type { ConsoleConnection } from "./ConsoleConnection";

export class MidiControllerManager {
  #controllers: Record<string, MidiController>;
  constructor() {
    this.#controllers = {};
  }

  get connections() {
    return this.#controllers;
  }

  register<T extends MidiController>(instance: T): T {
    this.#controllers[instance.id] = instance;
    return instance;
  }
}

export abstract class MidiController<
  D extends MidiDevice = MidiDevice,
  Config = any
> {
  id: string;
  protected device!: D;
  protected console!: ConsoleConnection;
  protected config: Config;

  constructor(connection: MidiConnection, config?: Config) {
    this.id = nanoid();
    this.config = config as Config;
    this.initMidiDevice(connection);
    if (!this.device) {
      throw new Error(
        "MIDI Controller did not correctly implement initDevice()"
      );
    }
  }

  toJSON(): MidiControllerInterop {
    return {
      id: this.id,
      type: "TODO: implement type",
      consoleId: this.console?.id,
      midiConnectionId: this.device.connection.id,
      config: this.config,
    };
  }

  abstract initMidiDevice(connection: MidiConnection): void;
  abstract initConsole(console: ConsoleConnection): void;
}
