import { implement } from "@orpc/server";
import { contract } from "./contract";

import MidiConnection from "$lib/MidiConnection";
import MidiControllerManager from "$lib/MidiController";
import ConsoleConnectionManager from "$lib/ConsoleConnection";

import { MidiControllerInteropNoConfig } from "$lib/types/MidiControllerInterop";

const os = implement(contract);

export const router = os.router({
  midi: {
    discoverMidiPorts: os.midi.discoverMidiPorts.handler(async () => {
      return MidiConnection.discover();
    }),

    getMidiConnections: os.midi.getMidiConnections.handler(() => {
      return Object.values(MidiConnection.connections).map((obj) =>
        obj.toJSON()
      );
    }),

    getMidiConnection: os.midi.getMidiConnection.handler(({ input }) => {
      return MidiConnection.connections[input.id]?.toJSON();
    }),

    getMidiControllers: os.midi.getMidiControllers.handler(() => {
      // Note: No need to strip the config, it's handled via Zod
      return Object.values(MidiControllerManager.connections).map((obj) =>
        obj.toJSON()
      );
    }),

    getMidiController: os.midi.getMidiController.handler(({ input }) => {
      return MidiControllerManager.connections[input.id]?.toJSON();
    }),
  },
  console: {
    discover: os.console.discover.handler(async () => {
      return ConsoleConnectionManager.discover();
    }),
    getConsoleConnections: os.console.getConsoleConnections.handler(() => {
      return Object.values(ConsoleConnectionManager.connections).map((obj) =>
        obj.toJSON()
      );
    }),
  },
});
