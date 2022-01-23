import sirv from 'sirv';
import express from 'express';
import compression from 'compression';
import * as sapper from '@sapper/server';
import bunyan from 'bunyan'
import SLAPI from './server/studioliveService'
import env from './server/env'
import midiService from './server/midiService';

const { NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';


globalThis.logger = bunyan.createLogger({
	name: "PreSonus StudioLive MIDI Integration",
	level: dev ? 'debug' : 'info'
})

if (!env.CONSOLE_HOST) {
	logger.error("CONSOLE_HOST not defiend, exiting")
	process.exit(1)
}



if (env.SERVER_ENABLE) {
	logger.info("Starting web server")

	if (env.SERVER_WEBMIDI) {
		logger.info("Enabling WebMIDI support")
		// todo
	}
	express()
		.use(
			compression({ threshold: 0 }),
			sirv('static', { dev }),
			sapper.middleware()
		)
		.listen(env.SERVER_PORT, env.SERVER_HOST, function () {
			const { address, port } = this.address()
			logger.info(`Web server listening on ${address}:${port}`)
		});
}

SLAPI.connect([env.CONSOLE_HOST, env.CONSOLE_PORT]).then(() => {
	if (env.SERVER_WEBMIDI_EXCLUSIVE) {
		logger.warn("Local MIDI listener not started because WebMIDI mode was set to exclusive")
	} else {
		SLAPI.withClient(client => {
			midiService.connect(client)
		})
	}
})