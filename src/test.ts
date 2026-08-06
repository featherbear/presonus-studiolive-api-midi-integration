import { ConsoleConnectionManager } from "$lib/ConsoleConnection";
import { MidiConnectionManager } from "$lib/MidiConnection";
import FaderPortController from "./controllers/presonus/faderport/controller";
import _logger from "$lib/logger";

const logger = _logger.child({ module: "test" });

const manager = new ConsoleConnectionManager();
const midiManager = new MidiConnectionManager();

let sl = manager.create({
  host: "192.168.0.202",
});

logger.info(
  { connection: midiManager.createVirtual("A").toJSON() },
  "Created virtual MIDI connection"
);
logger.info({ ports: MidiConnectionManager.discover() }, "Discovered MIDI ports");
let midiConnection = midiManager.create(
  "PreSonus FP8 Port 1",
  "PreSonus FP8 Port 1"
);

let fc = new FaderPortController(midiConnection, {
  model: 8,
  pages: [
    [
      { channel: { type: "LINE", channel: 1 } },
      { channel: { type: "LINE", channel: 2 } },
      undefined,
      { channel: { type: "LINE", channel: 3 } },
      undefined,
      undefined,
      undefined,
      undefined,
    ],
    [
      { channel: { type: "LINE", channel: 4 } },
      { channel: { type: "LINE", channel: 5 } },
      { channel: { type: "LINE", channel: 6 } },
      { channel: { type: "LINE", channel: 7 } },
      { channel: { type: "LINE", channel: 9 } },
      { channel: { type: "LINE", channel: 11 } },
      { channel: { type: "LINE", channel: 12 } },
      { channel: { type: "LINE", channel: 14 } },
    ],
  ],
});

fc.initConsole(sl);
