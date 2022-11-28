import easymidi from 'easymidi'
import type { InputDevice, OutputDevice } from "../../types/DeviceDescriptor"
import type { Input, Output, MidiTypes, MidiMessage } from '../../types/easymidiInterop'

export abstract class DeviceBase<ConfigType = unknown> {
    protected midiInput: Input
    protected midiOutput?: Output
    config: ConfigType

    constructor(input: InputDevice, output?: OutputDevice, config?: ConfigType) {
        this.midiInput = <Input>((typeof input === 'string') ? new easymidi.Input(input) : input)

        if (this.handle) (<any>this.midiInput.on)('message', this.handle)
        if (this.handleRaw) this.midiInput._input.on('message', (delta, bytes) => this.handleRaw(bytes, delta))
        
        if (output) this.midiOutput = <Output>((typeof output === 'string') ? new easymidi.Output(output) : output)

        this.config = config

        this.init?.()
    }

    init?()
    destroy?()

    protected handle?(message: MidiMessage)
    protected handleRaw?(bytes: Array<number>, delta: number)

    send(type: MidiTypes, bytes?: Buffer) {
        (<Function>this.midiOutput.send)(type, bytes)
    }

    sendRaw(bytes: number[] | Buffer) {
        this.midiOutput?._output.sendMessage(Buffer.isBuffer(bytes) ? [...bytes] : bytes)
    }


}


export default DeviceBase