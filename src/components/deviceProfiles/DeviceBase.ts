export abstract class DeviceBase {
    #midiDevice: unknown
    constructor(midiDevice) {
        this.#midiDevice = midiDevice
    }

    sendRaw(bytes: Buffer) {

    }

    abstract destroy?()
}

export default DeviceBase