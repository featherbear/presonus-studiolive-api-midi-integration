# PreSonus StudioLive API | MIDI Integration
---

A MIDI to StudioLive API integration

# Usage

* Install with `yarn`
* Copy `.env.example` to `.env` and modify variables
* Run with `yarn start`

# Configuration

|Key|Description|Example|
|:---:|:---|:---|
|`CONSOLE_HOST`|Console IP|`192.168.0.25`|
|`CONSOLE_PORT`|Console Port|`53000`|
|`SERVER_ENABLE`|Enable the web server?|`true`|
|`SERVER_HOST`|Web server bind address|`0.0.0.0`|
|`SERVER_PORT`|Web server bind port|`3000`|
|`SERVER_WEBMIDI`|Enable WebMIDI support?|`true`|
|`SERVER_WEBMIDI_EXCLUSIVE`|Exclusively enable WebMIDI (disable local MIDI)?|`false`|
|`MIDI_DEVICE`|Local MIDI device|...|
|`MIDI_CHANNEL`|<s>Local MIDI port</s>|<s>10</s>|

* `MIDI_DEVICE` - Set blank to attach to all local MIDI devices
* `MIDI_CHANNEL` - _Not implemented_

---



* TODO: Integrate with Chrome WebMIDI API for remote
* TODO: Device selection
* TODO: Implement MIDI channel
* TODO: Handle device connect / disconnect
* TODO: Online configurator

---

Tested against a Behringer X-Touch Mini USB MIDI controller

> On Layer A, the 8 control wheels control the faders for channels 1-8.  
If the control wheel buttons are pushed, those channels are muted.  
The fader on the control surface controls the fader for channel 9.
