import easymidi from 'easymidi'

export declare class Input extends easymidi.Input {
    _input: {
        on(msg: 'message', cb: Function)
    }
}

export declare class Output extends easymidi.Output {
    _output: {
        sendMesage(msg: Buffer)
    }
}

export type MidiTypes = "noteon" | "noteoff" | "poly aftertouch" | "cc" | "program" | "channel aftertouch" | "pitch" | "position" | "mtc" | "select" | "clock" | "start" | "continue" | "stop" | "activesense" | "reset" | "sysex"