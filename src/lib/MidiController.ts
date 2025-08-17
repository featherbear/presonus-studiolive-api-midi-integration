import { nanoid } from "nanoid";
import type { ConsoleConnection } from "./ConsoleConnection";
import type MidiDevice from "./MidiDevice";

abstract class MidiController<Device extends MidiDevice = MidiDevice, Config = undefined> {
  protected id: string;
  protected device: Device;
  protected config: Config;

  constructor(device: Device, config?: Config) {
    this.id = nanoid();
    this.device = device;
    this.config = config as Config
  }
}

export default MidiController;
