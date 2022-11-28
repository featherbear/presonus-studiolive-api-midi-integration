import type { MidiMessage } from "../../../../types/easymidiInterop";
import DeviceBase from "../../DeviceBase";
import * as OutputGenerator from "./internal/outputGenerator";

import { SysEx_KeepAlive } from "./internal/vendorConstants";

type ConfigType = {
    s: string
}

export default class FaderPortDevice extends DeviceBase<ConfigType> {
    private keepAliveTimer: NodeJS.Timeout
    #send<T extends OutputGenerator.WrappedFunction<any>>(fn: T, ...args: Parameters<T>) {
        console.log('Calling', fn, 'with args', ...args);
        let buffers = fn(...args)

        if (fn.type === 'raw') {
            buffers.forEach((buffer) => {
                console.log('Sending raw', buffer);
                this.sendRaw(buffer)
            })
        } else {
            buffers.forEach((buffer) => {
                console.log('Sending', fn.type, buffer);
                this.send(fn.type, buffer)
            })
        }
    }

    init() {
        this.keepAliveTimer = setInterval(() => {
            this.sendRaw(SysEx_KeepAlive)
        }, 1000)

        setTimeout(() => {
            this.setScribbleStrip(1, 1, 'hello')
            this.setScribbleStrip(2, 3, 'hello')
            // this.setFaderPosition(3, 50)
            // this.setLEDState(LED.ARM, BUTTON_STATE.ON)

        }, 4000)
    }

    // FIXME:
    setFaderPosition(...args: Parameters<typeof OutputGenerator.setFaderPosition>) {
        console.log('input', args);
        args[1] = Math.floor(args[1] * OutputGenerator.MAX_14 / 100)
        this.#send(OutputGenerator.setFaderPosition, ...args)
    }

    setLEDState(...args: Parameters<typeof OutputGenerator.setLEDState>) {
        this.#send(OutputGenerator.setLEDState, ...args)
    }

    setLEDColour(...args: Parameters<typeof OutputGenerator.setLEDColour>) {
        this.#send(OutputGenerator.setLEDColour, ...args)
    }
    setValueBar(...args: Parameters<typeof OutputGenerator.setValueBar>) {
        this.#send(OutputGenerator.setValueBar, ...args)
    }

    setValueBarMode(...args: Parameters<typeof OutputGenerator.setValueBarMode>) {
        this.#send(OutputGenerator.setValueBarMode, ...args)
    }

    setScribbleStrip(...args: Parameters<typeof OutputGenerator.setScribbleStrip>) {
        this.#send(OutputGenerator.setScribbleStrip, ...args)
    }

    setScribbleStripMode(...args: Parameters<typeof OutputGenerator.setScribbleStripMode>) {
        this.#send(OutputGenerator.setScribbleStripMode, ...args)
    }

    setPeakMeter(...args: Parameters<typeof OutputGenerator.setPeakMeter>) {
        this.#send(OutputGenerator.setPeakMeter, ...args)
    }

    setReductionMeter(...args: Parameters<typeof OutputGenerator.setReductionMeter>) {
        this.#send(OutputGenerator.setReductionMeter, ...args)
    }

    handle(message: MidiMessage) {
        console.log('parsed', arguments);
    }

    handleRaw() {
        console.log('raw', arguments);
    }

    destroy() {
        clearInterval(this.keepAliveTimer)
    }
}