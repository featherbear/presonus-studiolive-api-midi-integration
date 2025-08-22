import { z } from "zod";
import { eventIterator, oc } from "@orpc/contract";
import { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";
import { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";
import {
  MidiControllerInterop,
  MidiControllerInteropNoConfig,
} from "$lib/types/MidiControllerInterop";

export const contract = {
  midi: oc.prefix("/midi").router({
    discoverMidiPorts: oc
      .route({
        method: "GET",
        path: "/discover",
      })
      .output(
        z.object({
          input: z.array(z.string()),
          output: z.array(z.string()),
        })
      ),

    getMidiConnections: oc
      .route({
        method: "GET",
        path: "/connection",
      })
      .output(z.array(MidiConnectionInterop)),

    getMidiConnection: oc
      .route({
        method: "GET",
        path: "/connection/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      )
      .output(MidiConnectionInterop),

    listenMidiConnection: oc
      .route({
        method: "GET",
        path: "/connection/{id}/listen",
      })
      .input(
        z.object({
          id: z.string(),
        })
      )
      .output(
        eventIterator(
          z.object({
            type: z.enum(["input", "output"]),
            data: z.any(),
          })
        )
      ),

    getMidiControllers: oc
      .route({
        method: "GET",
        path: "/controller",
      })
      .output(z.array(MidiControllerInteropNoConfig)),
    getMidiController: oc
      .route({
        method: "GET",
        path: "/controller/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Controller"),
        })
      )
      .output(MidiControllerInterop),
  }),
  console: oc.prefix("/console").router({
    discover: oc
      .route({
        method: "GET",
        path: "/discover",
      })
      .output(
        z.array(
          z.object({
            name: z.string(),
            serial: z.string(),
            ip: z.string(),
            port: z.number().min(1).max(65535),
            timestamp: z.coerce.date(),
          })
        )
      ),
    getConsoleConnections: oc
      .route({
        method: "GET",
        path: "/connections",
      })
      .output(z.array(ConsoleConnectionInterop)),
  }),
};
