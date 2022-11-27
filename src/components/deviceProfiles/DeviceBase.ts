import easymidi from 'easymidi'
import type { InputDevice, OutputDevice } from "../../types/DeviceDescriptor"
import type { Input, Output, MidiTypes } from '../../types/easymidiInterop'

export abstract class DeviceBase<ConfigType = unknown> {
    protected midiInput: Input
    protected midiOutput?: Output
    config: ConfigType

    constructor(input: InputDevice, output?: OutputDevice, config?: ConfigType) {
        this.midiInput = <Input>((typeof input === 'string') ? new easymidi.Input(input) : input)

        if (this.handle) {
            this.midiInput.on(<any>'message', this.handle)
        }

        if (this.handleRaw) {
            this.midiInput._input.on('message', this.handleRaw)
        }

        if (output) {
            this.midiOutput = <Output>((typeof output === 'string') ? new easymidi.Output(output) : output)
        }

        this.config = config

        this.init?.()
    }

    init?()
    destroy?()

    protected handle?()
    protected handleRaw?()

    send(type: MidiTypes, bytes?: Buffer) {
        (<Function>this.midiOutput.send)(type, bytes)
    }

    sendRaw(bytes: Buffer) {
        this.midiOutput?._output.sendMesage(bytes)
    }


}


export default DeviceBase