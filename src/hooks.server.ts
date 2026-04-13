
export const load = () => {
  console.log("load hook");
};

export const setup = () => {
  console.log("setup hook?");
};

import fs from "node:fs";

import type { FaderPortConfig } from "./controllers/presonus/faderport/config";
import type { AppSettings } from "$lib/types/AppSettings";
import { init } from "./manager";

const settingsFile = "settings.json";

let settings: AppSettings = fs.existsSync(settingsFile)
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

init(settings);
