import DeviceBase from "../../DeviceBase";
import { SysEx_KeepAlive } from "./internal/vendorConstants";

type ConfigType = {
    s: string
}

export default class FaderPortDevice extends DeviceBase<ConfigType> {
    #keepAliveTimer: NodeJS.Timeout
    
    init() {
        this.#keepAliveTimer = setInterval(() => {
            this.send('sysex', SysEx_KeepAlive)
        }, 1000)
    }

    handle() {
    }

    destroy() {
        clearInterval(this.#keepAliveTimer)
    }
}