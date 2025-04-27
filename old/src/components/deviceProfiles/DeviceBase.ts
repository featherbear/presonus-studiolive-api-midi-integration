import type { Input, Output, MidiMessage, MidiDeviceGroup } from '../../types/easymidiInterop'


/**
 * The implementor of this class handles the sending and receiving of MIDI messages
 */
export abstract class DeviceBase {
    protected midiInput: Input
    protected midiOutput?: Output
    #sendFn: Output['send']

    #handleFn
    #handleRawFn

    constructor(midiDevice: MidiDeviceGroup) {
        console.log('DEVICE BASE CONSTRUCTOR');

        this.midiInput = <Input>midiDevice.input;
        this.midiOutput = <Output>midiDevice.output;

        this.#sendFn = this.midiOutput?.send.bind(this.midiOutput)

        if (this.handleMidiMessage) {
            this.#handleFn = (message: MidiMessage) => this.handleMidiMessage?.(message);
            (<any>this.midiInput.on)('message', this.#handleFn)
        }
        if (this.handleRawMidiMessage) {
            this.#handleRawFn = (delta: number, bytes: number[]) => this.handleRawMidiMessage?.(bytes, delta);
            this.midiInput._input.on('message', this.#handleRawFn)
        }

        this.init?.()
    }

    abstract init?()

    destroy() {
        if (this.handleMidiMessage) (<any>this.midiInput.off)('message', this.#handleFn)

        // FIXME: is there an off method
        // if (this.handleRaw) this.midiInput._input.off('message', this.#handleRawFn)
    
    }

    protected handleMidiMessage?(message: MidiMessage)
    protected handleRawMidiMessage?(bytes: Array<number>, delta: number)

    get send() {
        return this.#sendFn
    }

    sendRaw(bytes: number[] | Buffer) {
        this.midiOutput?._output.sendMessage(Buffer.isBuffer(bytes) ? [...bytes] : bytes)
    }


}


export default DeviceBase