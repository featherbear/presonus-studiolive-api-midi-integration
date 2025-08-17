import { ConsoleConnectionManager } from "$lib/ConsoleConnection";
import MidiConnectionManager from "$lib/MidiConnection";
import MidiDevice from "$lib/MidiDevice";
import FaderPortController from "./controllers/presonus/faderport/controller";
import FaderPortDevice from "./controllers/presonus/faderport/device";

const manager = new ConsoleConnectionManager();

let sl = manager.register({
  host: "192.168.0.202",
});

console.log(MidiConnectionManager.createVirtual("A"));
console.log(MidiConnectionManager.discover());
let midiConnection = MidiConnectionManager.register(
  "PreSonus FP8 Port 1",
  "PreSonus FP8 Port 1"
);

let fp = new FaderPortDevice(midiConnection);
let fc = new FaderPortController(fp, {
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

fc.connectConsole(sl)