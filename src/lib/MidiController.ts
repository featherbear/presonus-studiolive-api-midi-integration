import { nanoid } from "nanoid";
import type { MidiDevice } from "./MidiDevice";
import type { MidiConnection } from "./MidiConnection";

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
  Config = undefined
> {
  id: string;
  protected device!: D;
  protected config: Config;

  constructor(connection: MidiConnection, config?: Config) {
    this.id = nanoid();
    this.config = config as Config;
    this.initDevice(connection);
    if (!this.device) {
      throw new Error(
        "MIDI Controller did not correctly implement initDevice()"
      );
    }
  }

  abstract initDevice(connection: MidiConnection): void;
}
