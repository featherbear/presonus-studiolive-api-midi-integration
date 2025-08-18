import MidiConnection from "$lib/MidiConnection";
import { implement } from "@orpc/server";

import { contract } from "./contract";
// import ConsoleConnection from "$lib/ConsoleConnection";

const os = implement(contract);

export const router = os.router({
  midi: {
    discoverMidiPorts: os.midi.discoverMidiPorts.handler(async () => {
      return MidiConnection.discover();
    }),

    getMidiConnections: os.midi.getMidiConnections.handler(async () => {
      return MidiConnection.connections;
    }),

    getMidiConnection: os.midi.getMidiConnection.handler(async ({ input }) => {
      if (!input || !input.id) {
        return MidiConnection.connections;
      }

      return MidiConnection.connections[input.id];
    }),
  },
  console: {
    discover: os.console.discover.handler(async () => {
      throw new Error("Console discovery not implemented");
      // return ConsoleConnection.discover();
    })
  }
});
