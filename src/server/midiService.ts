import easymidi from "easymidi";
import type API from "presonus-studiolive-api-simple-api";
import type { Input, MidiDeviceGroup, Output } from "../types/easymidiInterop";
import type DeviceManager from "../types/DeviceManager";

export default (() => ({
	discover() {
		return easymidi.getInputs();
	},

	createVirtualPassthrough(name: string) {
		const inputDevice: Input = <Input>new easymidi.Input(`${name}-virtual`, true);
		const outputDevice: Output = <Output>new easymidi.Output(`${name}-virtual`, true);

		inputDevice.isPortOpen = () => true;

		let lastTime = new Date();
		return [
			inputDevice,
			outputDevice,
			function simulateInput(bytes: number[]) {
				const currentTime = new Date();
				inputDevice._input.emit("message", (currentTime.getTime() - lastTime.getTime()) / 1000, bytes);
				lastTime = currentTime;
			},
		] as const;
	},

	// Kinda just a centralised way to connect a device to a profile
	init<T extends DeviceManager<unknown>>(
		client: API,
		midiDeviceGroup: MidiDeviceGroup,
		profile: new (...args: any[]) => T,
		profileConfig: T["config"],
	) {
		const instance = new profile(midiDeviceGroup, profileConfig);
		// instance.setAPI(client);
		return instance
	},
}))();
