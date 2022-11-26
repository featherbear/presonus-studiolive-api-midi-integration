import DeviceBase from "../../DeviceBase";
import { SysEx_KeepAlive } from "./internal/vendorConstants";
export default class Device extends DeviceBase {
    #keepAliveTimer: NodeJS.Timeout

    constructor(...args: ConstructorParameters<typeof DeviceBase>) {
        super(...args)
        // this.sendRaw()

        this.#keepAliveTimer = setInterval(() => {
            this.sendRaw(SysEx_KeepAlive)
        },1000)
    }

    destroy() {
        clearInterval(this.#keepAliveTimer)
    }
}