// import ConsoleConnection from "$lib/ConsoleConnection";

export const load = () => {
  console.log("load hook");
};

export const setup = () => {
  console.log("setup hook?");
};

import ConsoleConnectionManager from "$lib/ConsoleConnection";
import MidiConnectionManager from "$lib/MidiConnection";
import type { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";
import type { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";
import type { MidiControllerInterop } from "$lib/types/MidiControllerInterop";
// // TODO: init hook
// console.log("hooks");
// // TODO: See how to integrate socketio

// console.log('Current console connections', ConsoleConnection.connections);

import fs from "node:fs";
import { set } from "zod";
import FaderPortController from "./controllers/presonus/faderport/controller";
import MidiControllerManager from "$lib/MidiController";
import type { FaderPortConfig } from "./controllers/presonus/faderport/config";
import { MessageCode } from "presonus-studiolive-api";
const settingsFile = "settings.json";
let settings: {
  midi: {
    connections: Record<string, MidiConnectionInterop>;
    controllers: Record<string, MidiControllerInterop>;
  };
  consoles: Record<string, ConsoleConnectionInterop>;
} = fs.existsSync(settingsFile)
  ? JSON.parse(fs.readFileSync(settingsFile, "utf-8"))
  : {
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
            type: "AAAA",
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

for (const midiConnectionConfig of Object.values(settings.midi.connections)) {
  const instance = MidiConnectionManager.addFromConfig(midiConnectionConfig);
  console.log("Registered MIDI connection", midiConnectionConfig);
}

for (const consoleConfig of Object.values(settings.consoles)) {
  const instance = ConsoleConnectionManager.addFromConfig(consoleConfig);
  console.log("Registered console connection", consoleConfig);
}

for (const midiControllerConfig of Object.values(settings.midi.controllers)) {
  const controllerClass = FaderPortController;
  const midiConnection = MidiConnectionManager.get(
    midiControllerConfig.midiConnectionId
  );
  if (!midiConnection) {
    console.warn(
      "FAILED to find MIDI connection",
      midiControllerConfig.midiConnectionId
    );
    continue;
  }

  const consoleConnection = ConsoleConnectionManager.get(
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

  MidiControllerManager.register(instance);
  instance.initConsole(consoleConnection);
  console.log("Registered MIDI Controller", midiControllerConfig);
}

fs.writeFileSync(
  settingsFile + "-state.json",
  JSON.stringify(settings, null, 4)
);
