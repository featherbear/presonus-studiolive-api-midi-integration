import env from "./server/env";
import sirv from "sirv";
import express from "express";
import compression from "compression";
import bodyParser from "body-parser";
import * as sapper from "@sapper/server";
import bunyan from "bunyan";
import studioliveService from "./server/studioliveService";
import midiService from "./server/midiService";

const { NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

globalThis.logger = bunyan.createLogger({
  name: "PreSonus StudioLive MIDI Integration",
  level: dev ? "debug" : "info",
});

function assertEnv(
  key: keyof typeof env,
  ...additionalChecks: ((input: (typeof env)[typeof key]) => string)[]
) {
  if (!env[key]) {
    logger.error(`${key} variable not defined, exiting`);
    process.exit(1);
  }

  for (let check of additionalChecks ?? []) {
    let res = check(env[key]);
    if (!res) continue;
    logger.error({ error: res }, `Invalid value for variable ${key}`);
    process.exit(1);
  }
}

assertEnv("CONSOLE_HOST");
assertEnv("MIDI_DEVICE");
assertEnv(
  "MIDI_CHANNEL",
  (c: number) => (c < 0 || c > 15) && "Value must be between 0 and 15"
);

import { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type DeviceDescriptor from "./types/DeviceDescriptor";
import { FADER_TOUCH } from "./components/deviceProfiles/presonus/faderport/interface/vendorConstants";
import type { Input, MidiDeviceGroup, Output } from "./types/easymidiInterop";
import FaderPortManager from "./components/deviceProfiles/presonus/faderport";
import type DeviceManager from "./types/DeviceManager";

let virtualInputMIDI: Input;
let virtualOutputMIDI: Output;
let midiFeedbackFunction: (data: any) => void = () => {};

if (env.SERVER_ENABLE) {
  logger.info("Starting web server");
  const app = express(); // Express server
  const httpServer = new HTTPServer(app); // HTTP server
  const io = new SocketIOServer(httpServer, { path: "/s" });

  // Global feedback for receiving MIDI events from devices
  midiFeedbackFunction = (data) => io.to("feedback").emit("feedback", data);
  io.on("connection", (socket) => socket.join("feedback"));

  app.use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    bodyParser.json()
  );

  io.of("/raw_midi_events_idk").on("connection", (conn) => {
    const registrations: Record<
      string,
      {
        callback: Function;
        timeout: NodeJS.Timeout;
      }
    > = {};

    conn.on("subscribe", (device) => {
      if (!(device in connectedMidiDevices)) {
        console.error("Device not found");
        return;
      }

      if (device in registrations) {
        console.log("MIDI event keepalive from", device);
        clearTimeout(registrations[device].timeout);
        registrations[device].timeout = setTimeout(
          () => registrations[device].callback(),
          5000
        );
        return;
      }

      console.log("Subscribing to MIDI device events from", device);

      // Tell MIDI device to subscribe
      const listenEvent = (data) => conn.emit("midi", data);
      connectedMidiDevices[device].input.addListener("message", listenEvent);

      registrations[device] = {
        callback() {
          console.log("Unsubscribing from MIDI device events from", device);
          connectedMidiDevices[device].input.removeListener(
            "message",
            listenEvent
          );
          delete registrations[device];
        },
        timeout: setTimeout(() => registrations[device].callback(), 5000),
      };
    });
  });

  if (env.SERVER_WEBMIDI) {
    logger.info("Enabling WebMIDI support");
    const [inputDevice, outputDevice, send] =
      midiService.createVirtualPassthrough("webmidi");

    io.of("/webmidi").on("connection", (conn) => {
      logger.info(
        { conn: conn.id, address: conn.handshake.address },
        "New WebMIDI client connected"
      );
      conn.on("message", (bytes) => send(bytes));
    });

    // Tap into the virtual MIDI device to send messages to the WebMIDI clients
    const _sendMessage = outputDevice._output.sendMessage;
    outputDevice._output.sendMessage = function (payload) {
      io.of("/webmidi").send(payload);
      _sendMessage(payload);
    };

    virtualInputMIDI = inputDevice;
    virtualOutputMIDI = outputDevice;
    logger.info("Created virtual MIDI device");
  } else {
    if (env.SERVER_WEBMIDI_EXCLUSIVE) {
      logger.fatal(
        "SERVER_WEBMIDI_EXCLUSIVE was set however SERVER_WEBMIDI was not"
      );
      process.exit(1);
    }
  }

  app.use(
    sapper.middleware({
      session: (req, res) => {
        return {
          // you can put other session data here

          capabilities: {
            webmidi: !!env.SERVER_WEBMIDI,
          },
        };
      },
    })
  );

  httpServer.listen(env.SERVER_PORT, env.SERVER_HOST, function () {
    const { address, port } = this.address();
    logger.info(`Web server listening on ${address}:${port}`);
  });
}

logger.info({ devices: midiService.discover() }, "Found MIDI devices");

import easymidi from "easymidi";
import store from "./server/config";

export function connectMidiDevice(deviceName: string): MidiDeviceGroup {
  return {
    input: new easymidi.Input(deviceName),
    output: new easymidi.Output(deviceName),
  };
}

let connectedMidiDevices: Record<string, MidiDeviceGroup> = {};

if (false) {
  studioliveService
    .connect({ host: env.CONSOLE_HOST, port: env.CONSOLE_PORT })
    .then(() => {
      if (env.SERVER_WEBMIDI_EXCLUSIVE) {
        logger.warn(
          "Local MIDI listener not started because WebMIDI mode was set to exclusive"
        );
      } else {
        const connectedMidiDevice = connectMidiDevice(env.MIDI_DEVICE);
        connectedMidiDevices[env.MIDI_DEVICE] = connectedMidiDevice;

        // connectedDevice.input.on(<any>"message", (msg) => {
        // 	const isLearning = true;

        // 	if (isLearning) {
        // 		midiFeedbackFunction({device: connectedDevice.input.name, data: msg});
        // 	}
        // });

        studioliveService.withClient((client) => {
          try {
            let c = midiService.init(
              client,
              connectedMidiDevice,
              FaderPortManager,
              {
                s: "",
                test: store,
              }
            );

            // console.log('Connecting to API');
            // c.connectAPI(client)
          } catch (e) {
            logger.fatal(e.message);
            process.exit(2);
          }
        });
      }

      if (env.SERVER_WEBMIDI) {
        studioliveService.withClient((client) => {
          // midiService.connect(client, {input: virtualInputMIDI, output: virtualOutputMIDI}, null)
        });
      }
    });
}
