import easymidi from 'easymidi'
import * as bunyan from 'bunyan'
import API from 'presonus-studiolive-api-simple-api'

declare global {
    var logger: bunyan
}

globalThis.logger = bunyan.createLogger({
    name: "PreSonus StudioLive MIDI Integration"
})

logger.info("Starting")

const inputDevices = easymidi.getInputs()
inputDevices.forEach(deviceName => {
    logger.info({ deviceName }, "Found MIDI input")
    let inputDevice = new easymidi.Input(deviceName)
    inputDevice.on('cc', function (data) {

        // For now, only handle channels 1 - 9
        if (data.controller <= 0 || data.controller > 9) return

        let value = Math.trunc(data.value / 127 * 100)
        logger.debug(
            {
                ...data,
                controller: deviceName,
                value
            },
            "Got control change"
        )
        sendValue(value, data.controller)
    })

    let closeCheckTimer =
        setInterval(() => {
            if (!inputDevice.isPortOpen()) {
                clearInterval(closeCheckTimer)
                logger.warn({ deviceName }, "MIDI device was disconnected")
            }
        }, 2000)
})

let sendValue: (value: number, channel: number) => any = () => { }

const HOST = "192.168.0.21"
logger.info({ host: HOST }, "Connecting to StudioLive console")
let client = new API(HOST)
client.connect({ clientName: "MIDI Integration" }).then(() => {
    logger.info("Successfully connected to StudioLive console")
    sendValue = (value: number, channel: number) => {
        client.setLevel({ type: "LINE", channel: channel }, value)
    }
})
