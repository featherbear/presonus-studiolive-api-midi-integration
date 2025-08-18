import { type MidiConnection } from "./MidiConnection";

/**
 * Base class for Midi Devices
 */
export abstract class MidiDevice {
  connection: MidiConnection;

  constructor(connection: MidiConnection) {
    this.connection = connection;
    this.init();
  }

  abstract init(): void;
  abstract destroy(): void;
}
