import env from './server/env'
import sirv from 'sirv';
import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser'
import * as sapper from '@sapper/server';
import bunyan from 'bunyan'
import studioliveService from './server/studioliveService'
import midiService from './server/midiService';

const { NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';


globalThis.logger = bunyan.createLogger({
	name: "PreSonus StudioLive MIDI Integration",
	level: dev ? 'debug' : 'info'
})

function assertEnv(key: keyof typeof env, ...additionalChecks: ((input: (typeof env)[typeof key]) => (string) | void)[]) {

	if (!env[key]) {
		logger.error(`${key} variable not defined, exiting`)
		process.exit(1)
	}

	for (let check of additionalChecks ?? []) {
		let res = check(env[key])
		if (!res) continue;
		logger.error({ error: res }, `Invalid value for variable ${key}`)
		process.exit(1)
	}
}

assertEnv('CONSOLE_HOST')
assertEnv('MIDI_DEVICE')
assertEnv('MIDI_CHANNEL', (c) => (c < 0 || c > 15) && "Value must be between 0 and 15")

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import type DeviceDescriptor from './types/DeviceDescriptor';
import { FADER_TOUCH } from './components/deviceProfiles/presonus/faderport/interface/vendorConstants';
import type { Input, Output } from './types/easymidiInterop';
import FaderPortManager from './components/deviceProfiles/presonus/faderport';

let virtualInputMIDI: Input;
let virtualOutputMIDI: Output;
let midiFeedbackFunction: (data: any) => void

if (env.SERVER_ENABLE) {
	logger.info("Starting web server")

	const app = express() // Express server
	const server = new HTTPServer(app) // HTTP server
	const io = new SocketIOServer(server, { path: '/s' })


	// Global feedback
	midiFeedbackFunction = (data) => io.to('feedback').emit('feedback', data)
	io.on('connection', socket => socket.join("feedback"))

	app.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		bodyParser.json(),
	)

	if (env.SERVER_WEBMIDI) {
		logger.info("Enabling WebMIDI support")
		const [inputDevice, outputDevice, send] = midiService.createVirtualPassthrough('webmidi')

		io.of('/webmidi').on('connection', (conn) => {
			logger.info({ conn: conn.id, address: conn.handshake.address }, "New WebMIDI client connected")
			conn.on('message', (bytes) => send(bytes))
		})

		let orig_sendMessage = outputDevice._output.sendMessage
		outputDevice._output.sendMessage = function (payload) {
			io.of('/webmidi').send(payload)
			orig_sendMessage(payload)
		}

		virtualInputMIDI = inputDevice
		virtualOutputMIDI = outputDevice
		logger.info("Created virtual MIDI device")
	} else {
		if (env.SERVER_WEBMIDI_EXCLUSIVE) {
			logger.fatal("SERVER_WEBMIDI_EXCLUSIVE was set however SERVER_WEBMIDI was not")
			process.exit(1)
		}
	}

	app.use(sapper.middleware({
		session: (req, res) => {
			return {
				capabilities: {
					webmidi: !!env.SERVER_WEBMIDI
				}
			}
		}
	}))

	server.listen(env.SERVER_PORT, env.SERVER_HOST, function () {
		const { address, port } = this.address()
		logger.info(`Web server listening on ${address}:${port}`)
	});
}

logger.info({ devices: midiService.discover() }, "Found MIDI devices")


const faderportDefaultConfig: DeviceDescriptor<FaderPortManager> = {
	inputDevice: "FaderPort FP8",
	outputDevice: "FaderPort FP8",
	profile: FaderPortManager,
	profileConfig: {
		s: ''
	}
}

studioliveService.connect({ host: env.CONSOLE_HOST, port: env.CONSOLE_PORT }).then(() => {
	if (env.SERVER_WEBMIDI_EXCLUSIVE) {
		logger.warn("Local MIDI listener not started because WebMIDI mode was set to exclusive")
	} else {
		studioliveService.withClient(client => {
			try {
				midiService.connect(client, [
					{
						inputDevice: env.MIDI_DEVICE,
						outputDevice: env.MIDI_DEVICE,
						profile: FaderPortManager,
						profileConfig: {

						}
					}

				]

					// {
					// device: env.MIDI_DEVICE,
					// eventCallback: midiFeedbackFunction
					// }
				)
			} catch (e) {
				logger.fatal(e.message)
				process.exit(2)
			}
		})
	}

	if (env.SERVER_WEBMIDI) {
		studioliveService.withClient(client => {
			midiService.connect(client,
				[
					{
						inputDevice: virtualInputMIDI,
						outputDevice: virtualOutputMIDI,
						profile: null
					}
				]
			)
		})
	}
})

