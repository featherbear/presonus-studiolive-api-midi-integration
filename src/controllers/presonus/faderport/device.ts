import { MidiDevice } from "$lib/MidiDevice";
import type { Faders16Channel } from "./lib/types";
import * as vendor from "./lib/vendorConstants";

class FaderPortDevice extends MidiDevice {
  private keepAliveTimer!: NodeJS.Timeout;

  init() {
    console.log("init FaderPortDevice");
    this.keepAliveTimer = setInterval(() => {
      this.connection.sendRaw(vendor.SysEx_KeepAlive);
    }, 1000);
  }

  destroy() {
    clearInterval(this.keepAliveTimer);
  }

  setFaderPosition100(fader: Faders16Channel, value100: number) {
    this.setFaderPosition14(fader, Math.floor((value100 * MAX_14) / 100));
  }

  setFaderPosition14(fader: Faders16Channel, value14: number) {
    this.connection.sendRaw(
      Buffer.from([0xe0 + fader - 1, ...value14Split(value14)])
    );
  }

  setLEDState(led: vendor.LED, state: vendor.BUTTON_STATE) {
    this.connection.sendRaw(Buffer.from([0x90, led, state]));
  }

  setLEDColour(
    button: vendor.LED_RGB,
    rgb: [r7: number, g7: number, b7: number]
  ) {
    this.connection.sendRaw(Buffer.from([0x91, button, (rgb[0] ?? 0) & 0x7f]));
    this.connection.sendRaw(Buffer.from([0x92, button, (rgb[1] ?? 0) & 0x7f]));
    this.connection.sendRaw(Buffer.from([0x93, button, (rgb[2] ?? 0) & 0x7f]));
  }

  setValueBar(fader: Faders16Channel, value7: number) {
    // TODO: Check if we can send CC
    this.connection.sendRaw(
      Buffer.from([0xb0, calculateValueBarSelector(fader), value7 & 0x7f])
    );
  }

  setValueBarMode(fader: Faders16Channel, mode: vendor.VALUE_BAR_MODE) {
    // TODO: Check if we can send CC
    this.connection.sendRaw(
      Buffer.from([0xb0, calculateValueBarSelector(fader) + 8, mode])
    );
  }

  setScribbleStrip(
    strip: Faders16Channel,
    line: 1 | 2 | 3 | 4,
    text: string,
    flags?: vendor.SCRIBBLE_STRIP_STRING_FORMAT
  ) {
    this.connection.sendRaw(
      Buffer.concat([
        vendor.SysExHdr,
        Buffer.from([0x12, strip - 1, line - 1, flags ?? 0]),
        Buffer.from(text),
        Buffer.from([0xf7]),
      ])
    );
  }

  setScribbleStripMode(
    strip: Faders16Channel,
    mode: vendor.SCRIBBLE_STRIP_MODE,
    keepExisting?: boolean
  ) {
    this.connection.sendRaw(
      Buffer.concat([
        vendor.SysExHdr,
        Buffer.from([
          0x13,
          strip - 1,
          mode |
            ((keepExisting
              ? vendor.SCRIBBLE_STRIP_REDRAW_MODE.KEEP
              : vendor.SCRIBBLE_STRIP_REDRAW_MODE.DISCARD) <<
              4),
          0xf7,
        ]),
      ])
    );
  }

  /**
   * Auto-decay after 1.8 seconds
   */
  setPeakMeter(strip: Faders16Channel, value7: number) {
    this.connection.sendRaw(
      Buffer.from([calculateMeterSelector(strip), value7 & 0x7f])
    );
  }

  /**
   * NOTE: The meter value does not automatically decay
   */
  setReductionMeter(strip: Faders16Channel, value7: number) {
    this.connection.sendRaw(
      Buffer.from([calculateMeterSelector(strip) + 8, value7 & 0x7f])
    );
  }
}

const MAX_14 = 0x3fff;

function calculateMeterSelector(fader: Faders16Channel) {
  if (1 <= fader && fader <= 8) {
    return 0xd0 + fader - 1;
  } else {
    return 0xc0 + fader - 1 - 8;
  }
}

function calculateValueBarSelector(fader: Faders16Channel) {
  if (1 <= fader && fader <= 8) {
    return 0x30 + fader - 1;
  } else {
    return 0x40 + fader - 1 - 8;
  }
}

const value14Split = (value14: number) => {
  value14 &= MAX_14;
  let lsb = value14 & 0x7f;
  let msb = value14 >> 7;

  return [lsb, msb];
};

export default FaderPortDevice;
