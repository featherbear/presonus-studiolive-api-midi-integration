import { z } from "zod";
import { eventIterator, oc } from "@orpc/contract";
import { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";
import { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";
import {
  DeviceControllerInteropWithConfig,
  DeviceControllerInterop,
} from "$lib/types/DeviceControllerInterop";

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

    saveMidiConnection: oc
      .route({
        method: "PUT",
        path: "/connection",
      })
      .input(
        MidiConnectionInterop.omit({ id: true }).extend({
          id: z.string().optional(),
        })
      )
      .output(MidiConnectionInterop),

    deleteMidiConnection: oc
      .route({
        method: "DELETE",
        path: "/connection/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      )
      .output(z.object({ success: z.boolean() })),

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
  }),
  controller: oc.router({
    getDeviceControllers: oc
      .route({
        method: "GET",
        path: "/controller",
      })
      .output(z.array(DeviceControllerInteropWithConfig)),
    getDeviceController: oc
      .route({
        method: "GET",
        path: "/controller/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Controller"),
        })
      )
      .output(DeviceControllerInteropWithConfig),

    saveDeviceController: oc
      .route({
        method: "PUT",
        path: "/controller",
      })
      .input(
        DeviceControllerInteropWithConfig.omit({ id: true }).extend({
          id: z.string().optional(),
        })
      )
      .output(DeviceControllerInteropWithConfig),

    deleteDeviceController: oc
      .route({
        method: "DELETE",
        path: "/controller/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Controller"),
        })
      )
      .output(z.object({ success: z.boolean() })),
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
        path: "/connection",
      })
      .output(z.array(ConsoleConnectionInterop)),
    getConsoleConnection: oc
      .route({
        method: "GET",
        path: "/connection/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      )
      .output(ConsoleConnectionInterop),

    saveConsoleConnection: oc
      .route({
        method: "PUT",
        path: "/connection",
      })
      .input(
        ConsoleConnectionInterop.omit({ id: true }).extend({
          id: z.string().optional(),
        })
      )
      .output(ConsoleConnectionInterop),

    deleteConsoleConnection: oc
      .route({
        method: "DELETE",
        path: "/connection/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      )
      .output(z.object({ success: z.boolean() })),

    getConsoleConnectionStatus: oc
      .route({
        method: "GET",
        path: "/connection/{id}/status",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      )
      .output(
        z.object({
          state: z.any(),
        })
      ),
  }),
};
