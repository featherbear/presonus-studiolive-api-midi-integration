import { EventPublisher, implement } from "@orpc/server";
import { contract } from "./contract";

import {
  midiConnectionManager,
  deviceControllerManager,
  consoleConnectionManager,
} from "../../manager";

const os = implement(contract);

export const router = os.router({
  midi: {
    discoverMidiPorts: os.midi.discoverMidiPorts.handler(async () => {
      return midiConnectionManager.discover();
    }),

    getMidiConnections: os.midi.getMidiConnections.handler(() => {
      return Object.values(midiConnectionManager.connections).map((obj) =>
        obj.toJSON(),
      );
    }),

    getMidiConnection: os.midi.getMidiConnection.handler(({ input }) => {
      const conn = midiConnectionManager.connections[input.id];
      if (!conn) {
        throw new Error(`MIDI connection ${input.id} not found`);
      }
      return conn?.toJSON();
    }),

    listenMidiConnection: os.midi.listenMidiConnection.handler(
      async function* ({ input, signal }) {
        let conn = midiConnectionManager.get(input.id);
        if (!conn) {
          throw new Error(`MIDI connection ${input.id} not found`);
        }

        const publisher = new EventPublisher<{
          event: { type: "input" | "output"; data: any };
        }>();

        const inputCallback = (data: any) =>
          publisher.publish("event", { type: "input", data });
        const outputCallback = (data: any) =>
          publisher.publish("event", { type: "output", data });

        try {
          conn.input.on("message", inputCallback);
          // conn.output?.on('event', outputCallback);
          // conn.output?.on('raw', outputCallback);

          for await (const payload of publisher.subscribe("event", {
            signal,
          })) {
            yield payload;
          }
        } finally {
          conn.input.off("message", inputCallback);
          // conn.output?.off("event", outputCallback);
          // conn.output?.off("raw", outputCallback);
        }
      },
    ),
  },
  controller: {
    getDeviceControllers: os.controller.getDeviceControllers.handler(() => {
      // Note: No need to strip the config, it's handled via Zod
      return Object.values(deviceControllerManager.connections).map((obj) =>
        obj.toJSON(),
      );
    }),

    getDeviceController: os.controller.getDeviceController.handler(({ input }) => {
      const controller = deviceControllerManager.connections[input.id];
      if (!controller) {
        throw new Error(`MIDI controller ${input.id} not found`);
      }

      return controller.toJSON();
    }),
  },
  console: {
    discover: os.console.discover.handler(async () => {
      return consoleConnectionManager.discover();
    }),
    getConsoleConnections: os.console.getConsoleConnections.handler(() => {
      return Object.values(consoleConnectionManager.connections).map((obj) =>
        obj.toJSON(),
      );
    }),
    getConsoleConnection: os.console.getConsoleConnection.handler(
      ({ input }) => {
        const conn = consoleConnectionManager.connections[input.id];
        if (!conn) {
          throw new Error(`Console connection ${input.id} not found`);
        }
        return conn.toJSON();
      },
    ),

    getConsoleConnectionStatus: os.console.getConsoleConnectionStatus.handler(
      ({ input }) => {
        let conn = consoleConnectionManager.connections[input.id];
        if (!conn) {
          throw new Error(`Console connection ${input.id} not found`);
        }

        return {
          state: conn.state,
        };
      },
    ),
  },
});
