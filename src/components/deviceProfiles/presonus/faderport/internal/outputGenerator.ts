import type { MidiTypes } from "../../../../../types/easymidiInterop";
import type { Faders16 } from "./interfaces";
import { BUTTON_STATE, LED, LED_RGB, SCRIBBLE_STRIP_MODE, SCRIBBLE_STRIP_REDRAW_MODE, SCRIBBLE_STRIP_STRING_FORMAT, SysExHdr, VALUE_BAR_MODE } from "./vendorConstants";

export const MAX_14 = 0x3FFF

const value14Split = (value14: number) => {
    value14 &= MAX_14
    let lsb = value14 & 0x7F
    let msb = value14 >> 7

    return [lsb, msb]
}

type OutputGenerator = (...args: any) => (Buffer | Buffer[])
export type WrappedFunction<T extends (...args: any) => (Buffer | Buffer[])> = ((...args: Parameters<T>) => Buffer[]) & { type: MidiTypes }

const wrapType: <T extends OutputGenerator>(fn: T, midiType: MidiTypes) => WrappedFunction<T>
    = <T extends OutputGenerator>(fn: T, midiType) => {
        let wrapped = (...args) => {
            let result: Buffer | Buffer[] = fn(...args)
            return Buffer.isBuffer(result) ? [result] : result
        }
        wrapped['type'] = midiType;
        return <WrappedFunction<T>>wrapped
    }

export const setFaderPosition = wrapType(function (fader: Faders16, value14: number) {
    console.log('incoming values', fader, value14);
    let res = Buffer.from([0xE0 + fader - 1, ...value14Split(value14)])
    console.log('here we go', res);
    return res
}, 'pitch')

export const setLEDState = wrapType(function (led: LED, state: BUTTON_STATE) {
    return Buffer.from([0x90, led, state])
}, 'noteon') // noteoff

export const setLEDColour = wrapType(function (button: LED_RGB, rgb: [r7: number, g7: number, b7: number]) {
    return [
        Buffer.from([0x91, button, (rgb[0] ?? 0) & 0x7F]),
        Buffer.from([0x92, button, (rgb[1] ?? 0) & 0x7F]),
        Buffer.from([0x93, button, (rgb[2] ?? 0) & 0x7F])
    ]
}, 'noteon') // noteoff

function _calculateValueBarSelector(fader: Faders16) {
    if (0 <= fader && fader <= 7) {
        return 0x30 + fader - 1
    } else {
        return 0x40 + fader - 1 - 8
    }
}

export const setValueBar = wrapType(function (fader: Faders16, value7: number) {
    return Buffer.from([0xB0, _calculateValueBarSelector(fader), value7 & 0x7F])
}, 'raw')

export const setValueBarMode = wrapType(function (fader: Faders16, mode: VALUE_BAR_MODE) {
    return Buffer.from([0xB0, _calculateValueBarSelector(fader) + 8, mode])
}, 'raw')

export const setScribbleStrip = wrapType(function (strip: Faders16, line: 1 | 2 | 3 | 4, text: string, flags?: SCRIBBLE_STRIP_STRING_FORMAT) {
    return Buffer.concat([
        SysExHdr,
        Buffer.from([0x12, strip, line, flags ?? 0]),
        Buffer.from(text),
        Buffer.from([0xF7])
    ])
}, 'sysex')

export const setScribbleStripMode = wrapType(function (strip: Faders16, mode: SCRIBBLE_STRIP_MODE, redraw?: boolean) {
    return Buffer.concat([
        SysExHdr,
        Buffer.from([
            0x13,
            strip,
            mode | ((redraw ? SCRIBBLE_STRIP_REDRAW_MODE.KEEP : SCRIBBLE_STRIP_REDRAW_MODE.DISCARD) << 4),
            0xF7
        ])
    ])
}, 'sysex')

function _calculateMeterSelector(fader: Faders16) {
    if (0 <= fader && fader <= 7) {
        return 0xD0 + fader - 1
    } else {
        return 0xC0 + fader - 1 - 8
    }
}

/**
 * Auto-decay after 1.8 seconds
 */
export const setPeakMeter = wrapType(function (strip: Faders16, value7: number) {
    return Buffer.from([
        _calculateMeterSelector(strip),
        value7 & 0x7F
    ])
}, 'channel aftertouch')

/**
 * Does not automatically decay
 */
export const setReductionMeter = wrapType(function (strip: Faders16, value7: number) {
    return Buffer.from([
        _calculateMeterSelector(strip) + 8,
        value7 & 0x7F
    ])
}, 'channel aftertouch')



