import env from "../../server/env";

import midiService from "../../server/midiService";
import type DeviceJSON from "./_DeviceJSON";

export async function get(req, res) {
	const response = <DeviceJSON>{
		active: { device: env.MIDI_DEVICE, channel: env.MIDI_CHANNEL },
		devices: midiService.discover(),
	};
	return res.end(JSON.stringify(response));
}
