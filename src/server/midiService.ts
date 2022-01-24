import easymidi from 'easymidi'
import config, { NoteAction } from './config'
import type API from 'presonus-studiolive-api-simple-api'

export default (() => ({
    discover() {
        return easymidi.getInputs()
    },
    connect(client: API, deviceName?: string) {
        (deviceName ? [deviceName] : easymidi.getInputs()).forEach(deviceName => {

            logger.info({ deviceName }, "Attaching to MIDI device")
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
                        return client.setLevel(controllerConfig.selector, Math.trunc(data.value / 127 * 100))
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




        let noteLatches = {}

        function handleNoteAction(action: NoteAction, noteConfig: typeof config['notes'][string]) {
            if (!action) return

            switch (action) {
                case 'mute': {
                    return client.mute(noteConfig.selector, true)
                }
                case 'unmute': {
                    return client.mute(noteConfig.selector, false)
                }
            }
        }

    }

}))()
