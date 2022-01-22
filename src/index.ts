import easymidi from 'easymidi'
import * as bunyan from 'bunyan'
import API from 'presonus-studiolive-api-simple-api'

import dotenv from 'dotenv'
dotenv.config()

declare global {
    var logger: bunyan
}

globalThis.logger = bunyan.createLogger({
    name: "PreSonus StudioLive MIDI Integration"
})

const { HOST, PORT } = process.env
if (!HOST) {
    logger.error("No HOST env set. Exiting")
}

logger.info("Starting")

import config, { NoteAction } from './config'

let noteLatches = {}

function handleNoteAction(action: NoteAction, noteConfig: typeof config['notes'][string]) {
    if (!action) return

    switch (action) {
        case 'mute': {
            return withClient(client => client.mute(noteConfig.selector, true))
        }
        case 'unmute': {
            return withClient(client => client.mute(noteConfig.selector, false))
        }
    }
}

const inputDevices = easymidi.getInputs()
inputDevices.forEach(deviceName => {
    logger.info({ deviceName }, "Found MIDI input")
    let inputDevice = new easymidi.Input(deviceName)

    inputDevice.on('noteon', function (data) {
        let note = data.note.toString()

        let noteConfig = config.notes[note]
        if (!noteConfig) return

        if (noteConfig.latch && noteLatches[note]) {
            noteLatches[note] = false
            handleNoteAction(noteConfig.onRelease, noteConfig)
        } else {
            if (noteConfig.latch) noteLatches[note] = true
            handleNoteAction(noteConfig.onPress, noteConfig)
        }
    })

    inputDevice.on('noteoff', function (data) {
        let note = data.note.toString()

        let noteConfig = config.notes[note]
        if (!noteConfig) return
        if (noteConfig.latch) return

        handleNoteAction(noteConfig.onRelease, noteConfig)
    })

    inputDevice.on('cc', function (data) {
        let controller = data.controller.toString()

        let controllerConfig = config.controllers[controller]
        if (!controllerConfig) return

        switch (controllerConfig.type) {
            case 'volume': {
                withClient(client => client.setLevel(controllerConfig.selector, Math.trunc(data.value / 127 * 100)))
            }
        }
    })

    let closeCheckTimer =
        setInterval(() => {
            if (!inputDevice.isPortOpen()) {
                clearInterval(closeCheckTimer)
                logger.warn({ deviceName }, "MIDI device was disconnected")
            }
        }, 2000)
})

let withClient: <F extends unknown>(fn: (client: API) => F) => F = () => {
    logger.warn("Dropping client command as the console was not yet connected")
    return null;
}

logger.info({ host: HOST }, "Connecting to StudioLive console")
new API(HOST).connect({ clientName: "MIDI Integration" }).then((client) => {
    logger.info("Successfully connected to StudioLive console")
    withClient = (fn) => fn(client)
})
