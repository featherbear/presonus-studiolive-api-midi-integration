import { ConsoleConnectionManager } from "$lib/ConsoleConnection";
import { MidiConnectionManager } from "$lib/MidiConnection";
import { MidiControllerManager } from "$lib/MidiController";

export const midiConnectionManager = new MidiConnectionManager();
export const midiControllerManager = new MidiControllerManager();
export const consoleConnectionManager = new ConsoleConnectionManager();

import type { AppSettings } from "$lib/types/AppSettings";

import FaderPortController from "./controllers/presonus/faderport/controller";

export function init(settings: AppSettings) {
  for (const midiConnectionConfig of Object.values(settings.midi.connections)) {
    const instance = midiConnectionManager.addFromConfig(midiConnectionConfig);
    console.log("Registered MIDI connection", midiConnectionConfig);
  }

  for (const consoleConfig of Object.values(settings.consoles)) {
    const instance = consoleConnectionManager.addFromConfig(consoleConfig);
    console.log("Registered console connection", consoleConfig);
  }

  for (const midiControllerConfig of Object.values(settings.midi.controllers)) {
    const controllerClass = FaderPortController;
    const midiConnection = midiConnectionManager.get(
      midiControllerConfig.midiConnectionId
    );
    if (!midiConnection) {
      console.warn(
        "FAILED to find MIDI connection",
        midiControllerConfig.midiConnectionId
      );
      continue;
    }

    const consoleConnection = consoleConnectionManager.get(
      midiControllerConfig.consoleId
    );
    if (!consoleConnection) {
      console.warn(
        "FAILED to find console connection",
        midiControllerConfig.consoleId
      );
      continue;
    }

    const instance = new controllerClass(
      midiConnection,
      midiControllerConfig.config
    );

    midiControllerManager.register(instance);
    instance.initConsole(consoleConnection);
    console.log("Registered MIDI Controller", midiControllerConfig);
  }
}
