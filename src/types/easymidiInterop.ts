import easymidi, { ChannelAfterTouch, ControlChange, Mtc, Note, Pitch, PolyAfterTouch, Position, Program, Select, Sysex } from 'easymidi'

export declare class Input extends easymidi.Input {
    _input: {
        on(msg: 'message', cb: Function)
        emit(msg: 'message', ...data)
    }
}

export declare class Output extends easymidi.Output {
    _output: {
        sendMessage(msg: Array<number>)
    }
}

type AddType<I, T> = I & { _type: T }
export type MidiMessage =
    AddType<Note, 'noteon' | 'noteoff'>
    | AddType<PolyAfterTouch, 'poly aftertouch'>
    | AddType<ControlChange, 'cc'>
    | AddType<Program, 'program'>
    | AddType<ChannelAfterTouch, 'channel aftertouch'>
    | AddType<Pitch, 'pitch'>
    | AddType<Position, 'position'>
    | AddType<Mtc, 'mtc'>
    | AddType<Select, 'select'>
    | AddType<{}, 'clock' | 'start' | 'continue' | 'stop' | 'activesense' | 'reset'>
    | AddType<Sysex, 'sysex'>


export type MidiTypes = "raw" | "noteon" | "noteoff" | "poly aftertouch" | "cc" | "program" | "channel aftertouch" | "pitch" | "position" | "mtc" | "select" | "clock" | "start" | "continue" | "stop" | "activesense" | "reset" | "sysex"