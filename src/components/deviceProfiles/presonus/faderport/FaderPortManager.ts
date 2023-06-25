import { ChannelSelector, Client, MessageCode } from "presonus-studiolive-api-simple-api";
import { settingsPathToChannelSelector } from 'presonus-studiolive-api-simple-api'

import type { MidiMessage } from "../../../../types/easymidiInterop";

import FaderPortDevice from "./interface/FaderPortDevice";
import type { Faders16, Faders8 } from "./interface/interfaces";
import { Button, BUTTON_STATE, LED_RGB, LED_SINGLE, FADER_TOUCH, Encoder, SCRIBBLE_STRIP_MODE, VELOCITY } from "./interface/vendorConstants";
import type DeviceManager from "../../../../types/DeviceManager";
import { MAX_14 } from "./interface/outputGenerator";

const channelMatches = (a: ChannelSelector, b: ChannelSelector) => {
    if (a.channel !== b.channel) return false
    if (a.type !== b.type) return false
    if (a.mixType !== b.mixType) return false
    if (a.mixNumber !== b.mixNumber) return false
    return true
}

let playStat;

const FADER_ROW = [FADER_TOUCH.FADER_1, FADER_TOUCH.FADER_2, FADER_TOUCH.FADER_3, FADER_TOUCH.FADER_4, FADER_TOUCH.FADER_5, FADER_TOUCH.FADER_6, FADER_TOUCH.FADER_7, FADER_TOUCH.FADER_8]
const MUTE_ROW = [LED_SINGLE.MUTE_1, LED_SINGLE.MUTE_2, LED_SINGLE.MUTE_3, LED_SINGLE.MUTE_4, LED_SINGLE.MUTE_5, LED_SINGLE.MUTE_6, LED_SINGLE.MUTE_7, LED_SINGLE.MUTE_8]
const SOLO_ROW = [LED_SINGLE.SOLO_1, LED_SINGLE.SOLO_2, LED_SINGLE.SOLO_3, LED_SINGLE.SOLO_4, LED_SINGLE.SOLO_5, LED_SINGLE.SOLO_6, LED_SINGLE.SOLO_7, LED_SINGLE.SOLO_8]
const SELECT_ROW_LED = [LED_RGB.SELECT_1, LED_RGB.SELECT_2, LED_RGB.SELECT_3, LED_RGB.SELECT_4, LED_RGB.SELECT_5, LED_RGB.SELECT_6, LED_RGB.SELECT_7, LED_RGB.SELECT_8]
const SELECT_ROW_BTN = [Button.SELECT_1, Button.SELECT_2, Button.SELECT_3, Button.SELECT_4, Button.SELECT_5, Button.SELECT_6, Button.SELECT_7, Button.SELECT_8, Button.SELECT_9, Button.SELECT_10, Button.SELECT_11, Button.SELECT_12, Button.SELECT_13, Button.SELECT_14, Button.SELECT_15, Button.SELECT_16]

export default class FaderPortManager extends FaderPortDevice implements DeviceManager {
    private selectedChannel: ChannelSelector
    private API: Client
    private APIregistrations: [string, Function][]

    private _currentPage: number;
    private pages: ChannelSelector[][]

    /**
     * State map to ignore the button noteoff events (well, noteon with velocity 0)
     */
    private cancelFeedbackMap: Record<Button, boolean>

    get visibleChannels() {
        return this.pages[this._currentPage]
    }

    constructor(...args: ConstructorParameters<typeof FaderPortDevice>) {
        super(...args)

        this.pages = [
            [
                { type: "LINE", channel: 1 },
                { type: "LINE", channel: 2 },
                { type: "LINE", channel: 3 },
                // { type: "LINE", channel: 4 },
                // { type: "LINE", channel: 5 },
                // { type: "LINE", channel: 6 },
                // { type: "LINE", channel: 12 },
                // { type: "LINE", channel: 14 }
            ],
            [
                { type: "LINE", channel: 4 },
                { type: "LINE", channel: 5 },
                { type: "LINE", channel: 6 },
                { type: "LINE", channel: 7 },
                { type: "LINE", channel: 9 },
                { type: "LINE", channel: 11 },
                { type: "LINE", channel: 12 },
                { type: "LINE", channel: 14 }
            ]
        ]
        this._currentPage = 0

        this.selectedChannel = null
        this.APIregistrations = []
        this.cancelFeedbackMap = <any>{}

        setTimeout(() => {
            this.refreshVisibleChannels()
        }, 1000)
    }

    // Use this function when registering API events to keep track of the event listeners
    private passthroughAPIEvent(evt: string, fn: Function): [typeof evt, typeof fn] {
        this.APIregistrations.push([evt, fn])
        return [evt, fn]
    }

    setAPI(api: Client) {
        if (this.API) {
            let _apiRegistrations = [...this.APIregistrations]
            this.APIregistrations = []
            _apiRegistrations.forEach(([evt, fn]) => this.API.removeListener(<any>evt, <any>fn))
        }

        this.API = api

        this.API.on(...<[any, any]>this.passthroughAPIEvent('level', evt => {
            this.tryNotifyFader(evt.channel, evt.level)
        }))

        this.API.on(...<[any, any]>this.passthroughAPIEvent('mute', evt => {
            this.tryNotifyMute(evt.channel, evt.status)
        }))

        this.API.on(...<[any, any]>this.passthroughAPIEvent('solo', evt => {
            this.tryNotifySolo(evt.channel, evt.status)
        }))

        this.API.on(MessageCode.ParamChars, ({ name, value }: { name: string, value: string }) => {
            if (name.endsWith('color')) {
                let channel = settingsPathToChannelSelector(name)
                for (let i = 0; i < 8; i++) {
                    if (!this.visibleChannels[i] || !channelMatches(this.visibleChannels[i], channel)) continue;
                    this.setLEDColour(SELECT_ROW_LED[i], [...<[number, number, number]><any>Buffer.from(value, "hex")])
                    break
                }
            }
        })



        // TODO: Do an update
    }

    private tryNotifyMute(channel: ChannelSelector, state: boolean) {
        for (let i = 0; i < 8; i++) {
            if (!this.visibleChannels[i] || !channelMatches(this.visibleChannels[i], channel)) continue;
            this.setLEDState(MUTE_ROW[i], state ? BUTTON_STATE.ON : BUTTON_STATE.OFF)
            break
        }
    }


    private tryNotifySolo(channel: ChannelSelector, state: boolean) {
        for (let i = 0; i < 8; i++) {
            if (!this.visibleChannels[i] || !channelMatches(this.visibleChannels[i], channel)) continue;
            this.setLEDState(SOLO_ROW[i], state ? BUTTON_STATE.ON : BUTTON_STATE.OFF)
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

    private clearScribbleStrip(strip: Faders16) {
        this.setScribbleStripMode(<Faders8>(strip), SCRIBBLE_STRIP_MODE.DEFAULT, true)
        this.setScribbleStrip(<Faders8>(strip), 1, "")
        this.setScribbleStrip(<Faders8>(strip), 2, "")
    }

    private refreshVisibleChannels() {
        for (let i = 0; i < 8; i++) {
            let currentChannel = this.visibleChannels[i];
            if (!currentChannel) {
                // Channel not found / disabled
                this.setLEDColour(SELECT_ROW_LED[i], [...<[number, number, number]><any>Buffer.from('ffffff', "hex")])
                this.setLEDState(SELECT_ROW_LED[i], BUTTON_STATE.OFF)
                this.setLEDState(MUTE_ROW[i], BUTTON_STATE.OFF)
                this.setLEDState(SOLO_ROW[i], BUTTON_STATE.OFF)
                this.setFaderPosition(<Faders8>(i + 1), 0)

                this.clearScribbleStrip(<Faders16>(i + 1))

                continue
            }

            this.setFaderPosition(<Faders8>(i + 1), this.API.getLevel(currentChannel))
            this.setLEDState(MUTE_ROW[i], this.API.getMute(currentChannel) ? BUTTON_STATE.ON : BUTTON_STATE.OFF)
            this.setLEDState(SOLO_ROW[i], this.API.getSolo(currentChannel) ? BUTTON_STATE.ON : BUTTON_STATE.OFF)
            console.log(i, SELECT_ROW_LED[i], this.selectedChannel == currentChannel ? BUTTON_STATE.ON : BUTTON_STATE.OFF);
            this.setLEDState(SELECT_ROW_LED[i], this.selectedChannel == currentChannel ? BUTTON_STATE.ON : BUTTON_STATE.OFF)

            let colour = this.API.getColour(currentChannel)
            if (typeof colour !== 'string') colour = 'ffffffff'
            this.setLEDColour(SELECT_ROW_LED[i], [...<[number, number, number]><any>Buffer.from(colour, "hex")])

            this.setScribbleStripMode(<Faders8>(i + 1), SCRIBBLE_STRIP_MODE.ALTERNATIVE_DEFAULT, false)
            const map = {
                1: "HH 1",
                2: "HH 2",
                3: "Spk",
                4: "Mic 1",
                5: "Mic 2",
                6: "Mic 3",
                7: "Drums",
                9: "Keys",
                11: "Acoustic",
                12: "Bass",
                14: "Aux"
            }

            this.setScribbleStrip(<Faders8>(i + 1), 1, map[currentChannel.channel] ?? currentChannel.channel?.toString())
            this.setScribbleStrip(<Faders8>(i + 1), 2, currentChannel.type)
        }
    }

    private selectChannel(channel: ChannelSelector) {
        this.selectedChannel = channel
        console.log('Selected channel', this.selectedChannel);
        this.refreshVisibleChannels()
    }

    private setPageIndex(idx: number) {
        this._currentPage = idx
        this.refreshVisibleChannels()
    }

    handle(message: MidiMessage) {
        let idx: number

        switch (message._type) {
            case 'noteon': {

                // Check fader activity
                idx = FADER_ROW.indexOf(message.note)
                if (idx !== -1) {
                    this.cancelFeedbackMap[message.note] = message.velocity === VELOCITY.NOTEON
                    return
                }

                if (message.velocity == VELOCITY.NOTEON) {

                    // Check mute press
                    // The MIDI note for the mute button's LED note is used...
                    idx = MUTE_ROW.indexOf(message.note)
                    if (idx !== -1&& this.visibleChannels[idx]) {
                        this.cancelFeedbackMap[message.note] = true
                        this.API.toggleMute(this.visibleChannels[idx])
                        return
                    }

                    // Check solo press
                    // The MIDI note for the solo button's LED note is used...
                    idx = SOLO_ROW.indexOf(message.note)
                    if (idx !== -1&& this.visibleChannels[idx]) {
                        this.cancelFeedbackMap[message.note] = true
                        this.API.toggleSolo(this.visibleChannels[idx])
                        return
                    }

                    // Check select press
                    idx = SELECT_ROW_BTN.indexOf(<Button>message.note)
                    if (idx !== -1 && this.visibleChannels[idx]) {
                        this.cancelFeedbackMap[message.note] = true
                        this.selectChannel(this.visibleChannels[idx])
                        return
                    }

                    switch (<Button>message.note) {
                        case Button.SOLO_CLEAR:
                            // this.API.setSolo()
                            console.log("TODO: SOLO CLEAR");

                            break
                        case Button.PLAY:
                            const channels: ChannelSelector[] = [
                                { type: "LINE", channel: 4 },
                                { type: "LINE", channel: 5 },
                                { type: "LINE", channel: 6 },
                                { type: "LINE", channel: 7 },
                                { type: "LINE", channel: 9 },
                                { type: "LINE", channel: 10 },
                                { type: "LINE", channel: 11 },
                                { type: "LINE", channel: 12 },
                            ]

                            channels.forEach((c) => this.API.setMute(c, !playStat))
                            playStat = !playStat
                            console.log('play');
                            break
                        case Button.NEXT: {
                            this.setPageIndex(Math.min(this.pages.length - 1, this._currentPage + 1))
                            break
                        }
                        case Button.PREV: {
                            this.setPageIndex(Math.max(0, this._currentPage - 1))
                            break
                        }
                    }


                } else {
                    if (message.velocity == VELOCITY.NOTEOFF && message.note == Button.PLAY) {
                        console.log('set state');
                        setTimeout(() => {
                            this.setLEDState(LED_SINGLE.PLAY, playStat ? BUTTON_STATE.OFF : BUTTON_STATE.ON)
                        }, 0)
                    }
                }

                // Fallback, echo midi message for noteon events (button press)
                if (this.cancelFeedbackMap[message.note]) {
                    delete this.cancelFeedbackMap[message.note]
                    return
                }

                console.log(message);
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

            case 'cc': {
                let delta = message.value
                if (delta > 64) delta = -delta + 64

                if (message.channel == 0) {
                    switch (<Encoder>message.controller) {
                        case Encoder.PAN_PARAM: {
                            console.log("Param", delta);
                            return
                        }
                        case Encoder.SESSION_NAVIGATOR: {
                            console.log('SESS', delta);
                            return
                        }
                    }
                }
                console.log({ ...message, value: delta })
                return
            }
        }
    }
}