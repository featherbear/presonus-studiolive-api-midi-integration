import fs from "node:fs";

import type { FaderPortConfig } from "../controllers/presonus/faderport/config";
import type { ConsoleConnectionInterop } from "./types/ConsoleConnectionInterop";
import type { AppSettings } from "./types/AppSettings";
import type { DeviceControllerInteropWithConfig } from "./types/DeviceControllerInterop";
import type { MidiConnectionInterop } from "./types/MidiConnectionInterop";

const settingsFile = "settings.json";

const defaultSettings: AppSettings = {
  midi: {
    connections: {
      fp8: {
        id: "fp8",
        name: "FaderPort 8",
        input: "PreSonus FP8 Port 1",
        output: "PreSonus FP8 Port 1",
      },
    },
    controllers: {
      fp8: {
        id: "fp8",
        type: "faderport",
        consoleId: "sl-test",
        midiConnectionId: "fp8",
        config: {
          model: 8,
          options: {
            pagesLoop: true,
          },
          pages: [
            [
              { channel: { type: "LINE", channel: 1 } },
              {
                channel: { type: "LINE", channel: 2 },
                override: {
                  name: "test override",
                },
              },
              undefined,
              { channel: { type: "LINE", channel: 3 } },
              undefined,
              undefined,
              undefined,
              { channel: { type: "LINE", channel: 2 } },
            ],
            [
              { channel: { type: "LINE", channel: 1 } },
              { channel: { type: "LINE", channel: 5 } },
              { channel: { type: "LINE", channel: 6 } },
              { channel: { type: "LINE", channel: 7 } },
              { channel: { type: "LINE", channel: 9 } },
              { channel: { type: "LINE", channel: 11 } },
              { channel: { type: "LINE", channel: 12 } },
              { channel: { type: "LINE", channel: 14 } },
            ],
          ],
        } satisfies FaderPortConfig,
      },
    },
  },
  consoles: {
    "sl-test": {
      address: {
        host: "192.168.0.202",
      },
      id: "sl-test",
      name: "Test Console",
    },
  },
};

export function readSettings(): AppSettings {
  if (!fs.existsSync(settingsFile)) {
    return structuredClone(defaultSettings);
  }

  return JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
}

export function writeSettings(settings: AppSettings) {
  fs.writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
}

export function saveConsoleConnectionSettings(
  connection: ConsoleConnectionInterop,
) {
  const settings = readSettings();
  settings.consoles[connection.id] = connection;
  writeSettings(settings);
  return connection;
}

export function deleteConsoleConnectionSettings(id: string) {
  const settings = readSettings();
  delete settings.consoles[id];
  writeSettings(settings);
}

export function saveMidiConnectionSettings(connection: MidiConnectionInterop) {
  const settings = readSettings();
  settings.midi.connections[connection.id] = connection;
  writeSettings(settings);
  return connection;
}

export function deleteMidiConnectionSettings(id: string) {
  const settings = readSettings();
  delete settings.midi.connections[id];
  writeSettings(settings);
}

export function saveDeviceControllerSettings(
  controller: DeviceControllerInteropWithConfig,
) {
  const settings = readSettings();
  settings.midi.controllers[controller.id] = controller;
  writeSettings(settings);
  return controller;
}

export function deleteDeviceControllerSettings(id: string) {
  const settings = readSettings();
  delete settings.midi.controllers[id];
  writeSettings(settings);
}
