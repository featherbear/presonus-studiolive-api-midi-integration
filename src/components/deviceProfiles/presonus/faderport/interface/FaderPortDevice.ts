import { claim_html_tag } from "svelte/internal";
import type { MidiMessage } from "../../../../../types/easymidiInterop";
import DeviceBase from "../../../DeviceBase";
import type { Faders16, Faders8 } from "./interfaces";
import * as OutputGenerator from "./outputGenerator";

import { BUTTON_STATE, LED, LED_RGB, SCRIBBLE_STRIP_MODE, SysEx_KeepAlive, VALUE_BAR_MODE } from "./vendorConstants";

type ConfigType = {
    s: string
}

export default class FaderPortDevice extends DeviceBase<ConfigType> {
    private keepAliveTimer: NodeJS.Timeout
    #send<T extends OutputGenerator.WrappedFunction<any>>(fn: T, ...args: Parameters<T>) {
        fn(...args).forEach((buffer) => this.sendRaw(buffer))
    }

    init() {
        this.keepAliveTimer = setInterval(() => {
            this.sendRaw(SysEx_KeepAlive)
        }, 1000)

        // setTimeout(() => {
        //     console.log('start tests');
        //     // {
        //     //     setInterval(() => {
        //     //         this.setFaderPosition(1, Math.random() * 100)
        //     //         this.setFaderPosition(2, Math.random() * 100)
        //     //         this.setFaderPosition(3, Math.random() * 100)
        //     //         this.setFaderPosition(4, Math.random() * 100)
        //     //         this.setFaderPosition(5, Math.random() * 100)
        //     //         this.setFaderPosition(6, Math.random() * 100)
        //     //         this.setFaderPosition(7, Math.random() * 100)
        //     //         this.setFaderPosition(8, Math.random() * 100)
        //     //     }, 1000)
        //     // }

        //     {
        //         let states = [BUTTON_STATE.FLASH, BUTTON_STATE.OFF, BUTTON_STATE.ON]
        //         setInterval(() => {
        //             this.setLEDState(LED.ARM, states[Math.floor(Math.random() * states.length)])
        //         }, 1000)
        //     }

        //     {
        //         this.setLEDState(LED.ALL, BUTTON_STATE.OFF)
        //         setInterval(() => {
        //             this.setLEDColour(LED_RGB.ALL, [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)])
        //         }, 100)
        //     }

        //     {
        //         let LEDs = [LED.MUTE_1, LED.SOLO_1, LED.MUTE_2, LED.SOLO_2, LED.MUTE_3, LED.SOLO_3, LED.MUTE_4, LED.SOLO_4, LED.MUTE_5, LED.SOLO_5, LED.MUTE_6, LED.SOLO_6, LED.MUTE_7, LED.SOLO_7, LED.MUTE_8, LED.SOLO_8,]

        //         let position = 0;
        //         let mode = BUTTON_STATE.ON
        //         setInterval(() => {
        //             this.setLEDState(LEDs[position++], mode)
        //             if (position == LEDs.length) {
        //                 mode = mode == BUTTON_STATE.ON ? BUTTON_STATE.OFF : BUTTON_STATE.ON
        //                 position = 0
        //             }
        //         }, 100)
        //     }

        //     {
        //         setInterval(() => {
        //             for (let i = 1; i < 8; i++) {
        //                 if (i != 3 && i != 4) this.setScribbleStripMode(<Faders8>i, 0)
        //                 this.setScribbleStrip(<Faders8>i, <1 | 2 | 3 | 4>(Math.floor(Math.random() * 4) + 1), 'A');
        //             }
        //         }, 1000)
        //     }

        //     {
        //         let val = 0
        //         let interval = 2;
        //         let increment = interval
        //         setInterval(() => {
        //             val += increment
        //             this.setValueBar(1, val)
        //             if (val == 126 || val == 0) increment = increment == interval ? -interval : interval
        //         }, 100)
        //     }

        //     {
        //         let modes = [VALUE_BAR_MODE.NORMAL, VALUE_BAR_MODE.BIPOLAR, VALUE_BAR_MODE.FILL, VALUE_BAR_MODE.SPREAD, VALUE_BAR_MODE.OFF]
        //         let mode = 0;
        //         setInterval(() => {
        //             this.setValueBarMode(1, mode)
        //             if (++mode == modes.length) {
        //                 mode = 0;
        //             }
        //         }, 10000)
        //     }

        //     {
        //         setInterval(() => {
        //             this.setScribbleStripMode(3, SCRIBBLE_STRIP_MODE.MIXED_TEXT_METERING, false)
        //             this.setPeakMeter(3, 100)
        //         }, 2500)
        //         setInterval(() => {
        //             this.setScribbleStripMode(4, SCRIBBLE_STRIP_MODE.MIXED_TEXT_METERING, false)
        //             this.setReductionMeter(4, Math.floor(Math.random() * 127))
        //         }, 500)
        //     }
        // }, 3000)
    }

    setFaderPosition(fader: Faders16, value100: number) {
        this.setFaderPosition100(fader, value100)
    }

    setFaderPosition100(fader: Faders16, value100: number) {
        this.setFaderPosition14(fader, Math.floor(value100 * OutputGenerator.MAX_14 / 100))
    }

    setFaderPosition14(...args: Parameters<typeof OutputGenerator.setFaderPosition>) {
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
        console.log('parsed', message);

        // Reflect button presses
        if (message._type == 'noteon') this.send('noteon', message)

    }

    destroy() {
        clearInterval(this.keepAliveTimer)
    }
}