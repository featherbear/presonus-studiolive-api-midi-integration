import easymidi from 'easymidi'
import type { InputDevice, OutputDevice } from "../../types/DeviceDescriptor"
import type { Input, Output, MidiTypes, MidiMessage } from '../../types/easymidiInterop'

export abstract class DeviceBase<ConfigType = unknown> {
    protected midiInput: Input
    protected midiOutput?: Output
    config: ConfigType

    constructor(input: InputDevice, output?: OutputDevice, config?: ConfigType) {
        this.midiInput = <Input>((typeof input === 'string') ? new easymidi.Input(input) : input)

        if (this.handle) (<any>this.midiInput.on)('message', (message: MidiMessage) => this.handle(message))
        if (this.handleRaw) this.midiInput._input.on('message', (delta, bytes) => this.handleRaw(bytes, delta))

        if (output) this.midiOutput = <Output>((typeof output === 'string') ? new easymidi.Output(output) : output)

        this.config = config

        this.init?.()
    }

    init?()
    destroy?()

    protected handle?(message: MidiMessage)
    protected handleRaw?(bytes: Array<number>, delta: number)

    get send() {
        return <Output['send']>this.midiOutput?.send.bind(this.midiOutput)
    }

    sendRaw(bytes: number[] | Buffer) {
        this.midiOutput?._output.sendMessage(Buffer.isBuffer(bytes) ? [...bytes] : bytes)
    }


}


export default DeviceBase