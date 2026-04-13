import { nanoid } from "nanoid";
import type { MidiDevice } from "./MidiDevice";
import type { MidiConnection } from "./MidiConnection";
import type { DeviceControllerInterop } from "./types/DeviceControllerInterop";
import type { ConsoleConnection } from "./ConsoleConnection";

export class DeviceControllerManager {
  #controllers: Record<string, DeviceController>;
  constructor() {
    this.#controllers = {};
  }

  get connections() {
    return this.#controllers;
  }

  register<T extends DeviceController>(instance: T): T {
    this.#controllers[instance.id] = instance;
    return instance;
  }
}

export abstract class DeviceController<
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

  toJSON(): DeviceControllerInterop {
    return {
      id: this.id,
      type: "TODO: implement type",
      consoleId: this.console?.id,
      midiConnectionId: this.device.connection.id,
    };
  }

  abstract initMidiDevice(connection: MidiConnection): void;
  abstract initConsole(console: ConsoleConnection): void;
}
