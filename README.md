# PreSonus StudioLive API MIDI Integration

A SvelteKit application for bridging local MIDI control surfaces to PreSonus StudioLive mixers through `@featherbear/presonus-studiolive-api`.

The project is currently a working prototype. It has a browser setup UI, runtime settings persistence, MIDI device discovery, StudioLive discovery, health checks, and an initial PreSonus FaderPort controller implementation.

## Current Capabilities

- Configure StudioLive mixer connections from `/setup/console`.
- Connect to mixers by fixed IP/port or by discovered console serial number.
- Configure MIDI devices from `/setup/midi`.
- Configure controller mappings from `/setup/controller`.
- Edit FaderPort channel pages and slot assignments in the controller setup UI.
- Persist configuration to `settings.json`.
- Expose health status at `/health` and `/health.json`.
- Expose the oRPC/OpenAPI API at `/api`.

## Requirements

- Node.js
- pnpm
- Local MIDI access for hardware controllers
- Network access to the StudioLive mixer

## Development

Install dependencies:

```sh
pnpm install
```

Run the development server:

```sh
pnpm dev
```

Open the app in the browser and use the Setup menu to configure consoles, MIDI devices, and controllers.

## Configuration

Runtime configuration is stored in `settings.json` at the project root. The app reads this file at startup. If it does not exist, the app falls back to default prototype settings defined in `src/lib/settings.ts`.

The `.env.example` file is not currently used by the app runtime. Older README instructions that referenced copying `.env.example` and setting `CONSOLE_HOST`, `MIDI_DEVICE`, or server variables are obsolete.

The main settings sections are:

- `consoles`: StudioLive mixer connections, either by `address` or `serial`.
- `midi.connections`: local MIDI input/output device definitions.
- `midi.controllers`: controller definitions and their channel page configuration.

Most settings should be edited through the setup UI rather than by hand.

## Setup Pages

- `/setup/console`: add or edit StudioLive mixer connections. Serial discovery is preferred when the mixer IP may change.
- `/setup/midi`: add or edit MIDI devices using discovered local MIDI ports.
- `/setup/controller`: add or edit controller definitions and configure which mixer channels appear on each controller page.

## Supported Controllers

The active controller implementation is focused on PreSonus FaderPort-style devices, especially the FaderPort 8/16 page and fader model.

The controller layer is still evolving. Additional controller support would be beneficial in the future, especially for:

- Behringer X-Touch Compact
- Behringer X-Touch Extender
- Icon Platform M or Platform M+

## Health And API

- `/health`: browser UI showing web, mixer, MIDI device, and controller health.
- `/health.json`: JSON health response.
- `/api`: API documentation and oRPC/OpenAPI endpoint.

## Known Limitations

- This is still a prototype and has incomplete areas.
- Delete actions in setup modals are not fully implemented.
- The old `src/test.ts` script is stale and currently does not type-check.
- Some FaderPort utility typing in `valueGenerator.ts` is still broken.
- The Socket.IO/WebMIDI path referenced by older code is not currently implemented.
- Configuration changes are saved to `settings.json`; some runtime changes require the live manager/controller path to rebuild the affected connection or controller.

## Verification

Useful commands:

```sh
pnpm exec svelte-check --output machine
pnpm exec tsc --noEmit --pretty false
```

At the time of writing, these checks still report known baseline issues in `src/controllers/presonus/faderport/lib/valueGenerator.ts` and stale `src/test.ts`.
