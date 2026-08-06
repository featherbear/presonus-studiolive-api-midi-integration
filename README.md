# PreSonus StudioLive API MIDI Integration

Use local MIDI surfaces to control PreSonus StudioLive mixers through `@featherbear/presonus-studiolive-api`.

The app currently provides browser-based setup, runtime settings persistence, health checks, and a PreSonus FaderPort 8/16 controller implementation.

## Current Features

- Configure StudioLive mixers by serial discovery or fixed IP/port.
- Configure local MIDI devices from discovered MIDI ports.
- Configure controllers that map MIDI devices to StudioLive mixers.
- Configure FaderPort channel pages and fader slot assignments.
- Delete saved mixers, MIDI devices, and controllers with confirmation prompts.
- View runtime health at `/health` or `/health.json`.
- View API docs at `/api`.

## Setup UI

- `/setup/console`: add, edit, or delete StudioLive mixer connections.
- `/setup/midi`: add, edit, or delete MIDI devices.
- `/setup/controller`: add, edit, or delete controllers and channel pages.

Consoles and MIDI devices cannot be deleted while a saved controller still references them. Delete or reassign the controller first.

## Configuration

Settings are stored in `settings.json` at the project root. If the file does not exist, prototype defaults from `src/lib/settings.ts` are used.

## Development

```sh
pnpm install
pnpm dev
```

## Supported Controllers

Current support is focused on PreSonus FaderPort-style devices, especially FaderPort 8 and FaderPort 16.

Future controller support that would be useful:

- Behringer X-Touch Compact
- Behringer X-Touch Extender
- Icon Platform M or Platform M+
