import { ChannelSelector, Client } from "presonus-studiolive-api-simple-api";
import { parseChannelString } from 'presonus-studiolive-api/dist/lib/util/channelUtil'

// import type { ChannelSelector } from 'presonus-studiolive-api'

import type { MidiMessage } from "../../../../types/easymidiInterop";

import FaderPortDevice from "./interface/FaderPortDevice";
import type { Faders8 } from "./interface/interfaces";
import { Button, BUTTON_STATE, LED_RGB, LED_SINGLE, FADER_TOUCH } from "./interface/vendorConstants";
import type DeviceManager from "../../../../types/DeviceManager";
import { MAX_14 } from "./interface/outputGenerator";

const channelMatches = (a: ChannelSelector, b: ChannelSelector) => {
    if (a.channel !== b.channel) return false
    if (a.type !== b.type) return false
    if (a.mixType !== b.mixType) return false
    if (a.mixNumber !== b.mixNumber) return false
    return true
}

const FADER_ROW = [FADER_TOUCH.FADER_1, FADER_TOUCH.FADER_2, FADER_TOUCH.FADER_3, FADER_TOUCH.FADER_4, FADER_TOUCH.FADER_5, FADER_TOUCH.FADER_6, FADER_TOUCH.FADER_7, FADER_TOUCH.FADER_8]
const MUTE_ROW = [LED_SINGLE.MUTE_1, LED_SINGLE.MUTE_2, LED_SINGLE.MUTE_3, LED_SINGLE.MUTE_4, LED_SINGLE.MUTE_5, LED_SINGLE.MUTE_6, LED_SINGLE.MUTE_7, LED_SINGLE.MUTE_8]
const SOLO_ROW = [LED_SINGLE.SOLO_1, LED_SINGLE.SOLO_2, LED_SINGLE.SOLO_3, LED_SINGLE.SOLO_4, LED_SINGLE.SOLO_5, LED_SINGLE.SOLO_6, LED_SINGLE.SOLO_7, LED_SINGLE.SOLO_8]
const SELECT_ROW = [LED_RGB.SELECT_1, LED_RGB.SELECT_2, LED_RGB.SELECT_3, LED_RGB.SELECT_4, LED_RGB.SELECT_5, LED_RGB.SELECT_6, LED_RGB.SELECT_7, LED_RGB.SELECT_8]

export default class FaderPortManager extends FaderPortDevice implements DeviceManager {
    private selectedChannel: ChannelSelector
    private visibleChannels: [ChannelSelector, ChannelSelector, ChannelSelector, ChannelSelector, ChannelSelector, ChannelSelector, ChannelSelector, ChannelSelector]
    private API: Client
    private APIregistrations: [string, Function][]

    private cancelFeedbackMap: Record<Button, boolean>

    constructor(...args: ConstructorParameters<typeof FaderPortDevice>) {
        super(...args)

        this.selectChannel = null
        this.visibleChannels = [
            { type: "LINE", channel: 1 },
            { type: "LINE", channel: 2 },
            { type: "LINE", channel: 3 },
            { type: "LINE", channel: 4 },
            { type: "LINE", channel: 5 },
            { type: "LINE", channel: 6 },
            { type: "LINE", channel: 7 },
            { type: "LINE", channel: 8 }
        ]
        this.APIregistrations = []
        this.cancelFeedbackMap = {}

        setTimeout(() => {
            this.refreshVisibleChannels()
        }, 1000)
        // [1, 2, 3, 4, 5, 6, 7, 8]
    }

    private passthroughAPIEvent(evt, fn): [string, Function] {
        this.APIregistrations.push([evt, fn])
        return [evt, fn]
    }

    setAPI(api: Client) {
        if (this.API) {
            let oldRegistrations = [...this.APIregistrations]
            this.APIregistrations = []
            oldRegistrations.forEach(([evt, fn]) => this.API.removeListener(<any>evt, <any>fn))
        }

        this.API = api

        this.API.on(...this.passthroughAPIEvent('level', evt => {
            this.tryNotifyFader(evt.channel, evt.level)
        }))

        this.API.on(...this.passthroughAPIEvent('mute', evt => {
            this.tryNotifyMute(evt.channel, evt.status)
        }))
        // TODO: Do an update
    }

    private tryNotifyMute(channel: ChannelSelector, state: boolean) {
        for (let i = 0; i < 8; i++) {
            if (!this.visibleChannels[i] || !channelMatches(this.visibleChannels[i], channel)) continue;
            this.setLEDState(MUTE_ROW[i], state ? BUTTON_STATE.ON : BUTTON_STATE.OFF)
            break
        }
    }


    private tryNotifyFader(channel: ChannelSelector, level100: number) {
        for (let i = 0; i < 8; i++) {
            if (this.cancelFeedbackMap[FADER_ROW[i]]) continue

            if (!this.visibleChannels[i] || !channelMatches(this.visibleChannels[i], channel)) continue;

            this.setFaderPosition(<Faders8>(i + 1), level100)
            break
        }
    }

    private refreshVisibleChannels() {
        [1, 2, 3, 4, 5, 6, 7, 8]

        for (let i = 0; i < 8; i++) {
            let currentChannel = this.visibleChannels[i];
            if (!currentChannel) {
                // Channel not found / disabled
                continue
            }

            this.setFaderPosition(<Faders8>(i + 1), this.API.getLevel(currentChannel))
            this.setLEDState(MUTE_ROW[i], this.API.getMute(currentChannel) ? BUTTON_STATE.ON : BUTTON_STATE.OFF)

            // FIXME: Add getSolo into API
            this.setLEDState(SOLO_ROW[i], this.API.state.get(parseChannelString(currentChannel) + "/solo") ? BUTTON_STATE.ON : BUTTON_STATE.OFF)

            // FIXME: Fix null colour
            let colour = this.API.getColour(currentChannel)
            if (typeof colour !== 'string') colour = '000000ff'
            this.setLEDColour(SELECT_ROW[i], [...<[number, number, number]><any>Buffer.from(colour, "hex")])
        }


        // Update select button states
        let buttonID: LED_RGB = SELECT_ROW[this.visibleChannels.indexOf(this.selectedChannel)]
        Object.values(LED_RGB).filter(id => id !== buttonID).forEach((id: LED_RGB) => {
            this.setLEDState(id, BUTTON_STATE.OFF)
        })

        if (buttonID) this.setLEDState(buttonID, BUTTON_STATE.ON)
    }

    private selectChannel(channel: ChannelSelector) {
        this.selectedChannel = channel
        this.refreshVisibleChannels()
    }

    private setVisibleChannels(channels: typeof this.visibleChannels) {
        this.visibleChannels = channels
        this.refreshVisibleChannels()
    }

    handle(message: MidiMessage) {
        let idx: number

        switch (message._type) {
            case 'noteon': {

                // Check fader activity
                idx = FADER_ROW.indexOf(message.note)
                if (idx !== -1) {
                    this.cancelFeedbackMap[message.note] = message.velocity === 127
                    return
                }

                if (message.velocity == 0x7F) {

                    // Check mute press
                    idx = MUTE_ROW.indexOf(message.note)
                    if (idx !== -1) {
                        this.cancelFeedbackMap[message.note] = true
                        this.API.toggleMute(this.visibleChannels[idx])
                        return
                    }

                    // Check solo press
                    idx = SOLO_ROW.indexOf(message.note)
                    if (idx !== -1) {
                        this.cancelFeedbackMap[message.note] = true
                        // TODO: Implement in API
                        return
                    }
                }

                // Fallback, echo midi message for noteon events (button press)
                if (this.cancelFeedbackMap[message.note]) {
                    delete this.cancelFeedbackMap[message.note]
                    return
                }


                this.send('noteon', message)

                return;
            }

            case 'pitch': {
                idx = message.channel
                if (!this.visibleChannels[idx]) return
                let level = message.value / MAX_14 * 100
                this.API.setChannelVolumeLinear(this.visibleChannels[idx], level)
                return
            }

        }

        console.log(message);
    }

}