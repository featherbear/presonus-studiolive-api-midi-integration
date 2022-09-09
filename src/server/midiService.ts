import easymidi from 'easymidi'
import type { ControlChange, Note } from 'easymidi'
import config, { NoteAction } from './config'
import type API from 'presonus-studiolive-api-simple-api'

export default (() => ({
    discover() {
        return easymidi.getInputs()
    },
    createVirtualPassthrough(name: string) {
        let inputDevice = new easymidi.Input(name + '-virtual', true)
        let outputDevice = new easymidi.Output(name + '-virtual', true)

        inputDevice.isPortOpen = () => true

        let lastTime = new Date()
        return [inputDevice, outputDevice, function sendInput(bytes: number[]) {
            let currentTime = new Date()
            inputDevice['_input'].emit('message', (currentTime.getTime() - lastTime.getTime()) / 1000, bytes)
            lastTime = currentTime
        }] as const
    },
    connect(client: API, opts?: { device?: string, eventCallback?: (event: any) => void }) {
        let devices = []

        if (!!opts?.device) {
            if (typeof opts?.device === 'object' && opts?.device['constructor']['name'] !== 'Input') {
                throw new Error("`device` must be a string or a MIDI input device")
            }

            devices = [opts?.device]
        } else {
            devices = easymidi.getInputs()
        }

        devices.forEach((_device: string | easymidi.Input) => {
            // Log before actual functionality
            logger.info({ deviceName: (_device as easymidi.Input)?.name ?? _device }, "Attaching to MIDI device")

            let device = (typeof _device === 'string') ? new easymidi.Input(_device) : _device

            device.on('noteon', function (data: Note) {
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

            device.on('noteoff', function (data: Note) {
                let note = data.note.toString()

                let noteConfig = config.notes[note]
                if (!noteConfig) return
                if (noteConfig.latch) return

                handleNoteAction(noteConfig.onRelease, noteConfig)
            })

            device.on('cc', function (data: ControlChange) {
                let controller = data.controller.toString()

                let controllerConfig = config.controllers[controller]
                if (!controllerConfig) return

                switch (controllerConfig.type) {
                    case 'volume': {
                        return client.setChannelVolumeLinear(controllerConfig.selector, Math.trunc(data.value / 127 * 100))
                    }
                }
            })

            if (typeof opts?.eventCallback === 'function') {
                device.on('message' as any, (data) => opts.eventCallback(data))
            }

            let closeCheckTimer =
                setInterval(() => {
                    if (!device.isPortOpen()) {
                        clearInterval(closeCheckTimer)
                        logger.warn({ device: device.name }, "MIDI device was disconnected")
                    }
                }, 2000)
        })

        let noteLatches = {}

        function handleNoteAction(action: NoteAction, noteConfig: typeof config['notes'][string]) {
            if (!action) return

            switch (action) {
                case 'mute': {
                    return client.setMute(noteConfig.selector, true)
                }
                case 'unmute': {
                    return client.setMute(noteConfig.selector, false)
                }
            }
        }

    }

}))()
