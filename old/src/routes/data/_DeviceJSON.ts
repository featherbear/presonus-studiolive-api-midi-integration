interface DeviceJSON {
	active: {
		device: string;
		channel: number;
	};
	devices: string[];
}

export default DeviceJSON;
