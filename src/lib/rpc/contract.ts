import MidiConnection from "$lib/MidiConnection";

import { z } from "zod";
import { oc } from "@orpc/contract";

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

    getMidiConnections: oc.route({
      method: "GET",
      path: "/connection",
    }),
    // .output(z.object({}))
    getMidiConnection: oc
      .route({
        method: "GET",
        path: "/connection/{id}",
      })
      .input(
        z.object({
          id: z.string().describe("Connection"),
        })
      ),
    // .output(z.object({}))
  }),
  console: oc.prefix("/console").router({
    discover: oc.route({
      method: "GET",
      path: "/discover",
    }),
  }),
};
