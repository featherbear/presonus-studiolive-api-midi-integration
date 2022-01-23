import env from '../../server/env'

export function get(req, res) {
    return res.end(JSON.stringify({device: env.MIDI_DEVICE, channel: env.MIDI_CHANNEL}))
}