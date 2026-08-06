import { ConsoleConnectionManager } from "$lib/ConsoleConnection";
import _logger from "$lib/logger";
import { MidiConnectionManager } from "$lib/MidiConnection";
import { DeviceControllerManager } from "$lib/DeviceController";

export const midiConnectionManager = new MidiConnectionManager();
export const consoleConnectionManager = new ConsoleConnectionManager();

export const deviceControllerManager = new DeviceControllerManager();

import type { AppSettings } from "$lib/types/AppSettings";

import FaderPortController from "./controllers/presonus/faderport/controller";
import type { DeviceControllerInteropWithConfig } from "$lib/types/DeviceControllerInterop";

const logger = _logger.child({ module: "manager" });

export function init(settings: AppSettings) {
  for (const midiConnectionConfig of Object.values(settings.midi.connections)) {
    const instance = midiConnectionManager.addFromConfig(midiConnectionConfig);
    logger.info({ config: midiConnectionConfig }, "Registered MIDI connection");
  }

  for (const consoleConfig of Object.values(settings.consoles)) {
    const instance = consoleConnectionManager.addFromConfig(consoleConfig);
    logger.info({ config: consoleConfig }, "Registered console connection");
  }

  for (const deviceControllerConfig of Object.values(settings.midi.controllers)) {
    const midiConnection = midiConnectionManager.get(
      deviceControllerConfig.midiConnectionId,
    );
    if (!midiConnection) {
      logger.warn(
        { id: deviceControllerConfig.midiConnectionId },
        "FAILED to find MIDI connection",
      );
      continue;
    }

    const consoleConnection = consoleConnectionManager.get(
      deviceControllerConfig.consoleId,
    );
    if (!consoleConnection) {
      logger.info(
        { id: deviceControllerConfig.consoleId },
        "FAILED to find console connection",
      );
      continue;
    }

    const instance = createDeviceControllerFromConfig(deviceControllerConfig);
    if (!instance) continue;

    logger.info({ config: deviceControllerConfig }, "Registered MIDI Controller");
  }
}

export function createDeviceControllerFromConfig(
  config: DeviceControllerInteropWithConfig,
) {
  const midiConnection = midiConnectionManager.get(config.midiConnectionId);
  if (!midiConnection) {
    throw new Error(`MIDI connection ${config.midiConnectionId} not found`);
  }

  const consoleConnection = consoleConnectionManager.get(config.consoleId);
  if (!consoleConnection) {
    throw new Error(`Console connection ${config.consoleId} not found`);
  }

  if (config.type !== "faderport" && config.type !== "AAAA") {
    throw new Error(`Unsupported controller type ${config.type}`);
  }

  const instance = new FaderPortController(midiConnection, config.config);
  instance.id = config.id;
  instance.type = "faderport";
  deviceControllerManager.register(instance);
  instance.initConsole(consoleConnection);
  return instance;
}
