class DeviceBase {
    #midiDevice: unknown
    constructor(midiDevice) {
        this.#midiDevice = midiDevice
    }

    sendRaw(bytes: Buffer) {

    }
}

export default class Device extends DeviceBase {
    constructor(...args: ConstructorParameters<typeof DeviceBase>) {
        super(...args)
        // this.sendRaw()
    }
}