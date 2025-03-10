import type { Client } from "presonus-studiolive-api-simple-api";
import DeviceBase from "../components/deviceProfiles/DeviceBase";
import type { MidiDeviceGroup } from "./easymidiInterop";

export default abstract class DeviceManager<ConfigType> extends DeviceBase {
    abstract config: ConfigType

    constructor(midiDevice: MidiDeviceGroup, config: ConfigType) {
        super(midiDevice)
    }
    
    abstract setAPI(api: Client)
}