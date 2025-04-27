<script context="module">
  export async function preload(_, session) {
    if (!session.capabilities.webmidi) {
      return this.error(405, "WebMIDI is not enabled by the server");
    }

    let device = this.fetch("data/device.json").then((r) => r.json());
    let config = this.fetch("data/map.json").then((r) => r.json());

    return {
      device: await device,
      config: await config,
    };
  }
</script>

<script lang="ts">
  import type DeviceJSON from "./data/_DeviceJSON";
  import type MapJSON from "./data/_MapJSON";

  export let device: DeviceJSON;
  export let config: MapJSON;

  import { onMount } from "svelte";

  type Timeout = number;

  /**
   * When a MIDI control is made, raw MIDI bytes are transmitted over the WebSockets connection
   * The server then receives and processes the MIDI bytes, possibly calling the StudioLive API
   * The API may emit events which are handled and emitted as MIDI events to the virtual MIDI device
   *   whose MIDI bytes are then received by the web client via WebSockets.
   * There can exist a decent delay between this roundtrip, so we will ignore any received MIDI bytes
   *   of a channel that was recently touched by the MIDI device
   * 
   * TODO: Debounce per WebMIDI device
   */
  let debouncer = new (class {
    #locks: { [identifier: number]: Timeout };
    #queue: { [identifier: number]: Function };

    constructor() {
      this.#locks = {};
      this.#queue = {};
    }

    /**
     * Gonna cheat and just use the first byte, though this limits the debounce to just the action type
     * TODO: Parse the actual MIDI bytes?
     */
    #extractIdentifier(bytes: Uint8Array | number[]) {
      return bytes[0];
    }

    queue(bytes: Uint8Array | number[], callback: Function) {
      let identifier = this.#extractIdentifier(bytes);

      // No debounce needed, fire asynchronously immediately
      if (!this.#locks[identifier]) {
        (async () => callback())();
        return;
      }

      this.#queue[identifier] = callback;
    }
    /**
     * Register a note/control as touched
     */
    touch(bytes: Uint8Array | number[]) {
      let identifier = this.#extractIdentifier(bytes);

      // Expire existing debounce timer
      if (this.#locks[identifier]) clearTimeout(this.#locks[identifier]);

      this.#locks[identifier] = setTimeout(() => {
        let callback = this.#queue[identifier];

        // Fire callback asynchronously if it exists
        if (callback) {
          delete this.#queue[identifier];

          console.debug("(callback) Asserting state");
          (async () => callback())();
        }

        // Cleanup
        delete this.#locks[identifier];
      }, 50);
    }
  })();

  let latches: { [identifier: string]: boolean } = {};

  onMount(async () => {
    let SocketIO = await import("socket.io-client");
    console.log("Connecting to WebSockets WebMIDI tunnel endpoint");
    let client = SocketIO.io("/webmidi", { path: "/s" });

    console.log("Connecting to MIDI controllers");

    if (!navigator.requestMIDIAccess) return;

    try {
      let midiAccess = await navigator.requestMIDIAccess();

      for (let input of midiAccess.inputs.values()) {
        console.log(
          `Found MIDI Input Device: ${[input.manufacturer, input.name]
            .map((s) => s.trim())
            .filter((v) => v)
            .join(" ")}`
        );

        // TODO: Select which MIDI device is in use

        input.addEventListener("midimessage", function ({ data }) {
          let newData = [...data];

          // FIXME: Latching is kinda a hack, should probably handle this server side
          if ([0x8, 0x9].includes(data[0] >> 4) && config.notes[data[1]]?.latch) {
            // TODO: Handle channel
            if (data[0] == 154) {
              if (latches[data[1]]) {
                
                // Instant state
                for (let output of midiAccess.outputs.values()) {
                  if (output.name != input.name) continue;
                  output.send([138, data[1], 0]);
                  break;
                }
              }
              latches[data[1]] = !latches[data[1]];
            } else if (data[0] == 138) {
              if (latches[data[1]]) {
                // Force back on
                newData = [154, data[1], 127];

                for (let output of midiAccess.outputs.values()) {
                  if (output.name != input.name) continue;
                  output.send(newData);
                  break;
                }
              }

              return;
            }
          }

          console.debug("Sending MIDI bytes", newData);

          debouncer.touch(newData);
          client.send(newData);
        });
      }

      client.on("message", function (data) {
        console.debug("Received MIDI bytes", data);
        // TODO: Select which MIDI device is in use

        // TODO: Would be nice to know the current latched values

        debouncer.queue(data, () => {
          for (let output of midiAccess.outputs.values()) {
            output.send(data);
          }
        });
      });
    } catch (error) {
      console.error("No MIDI access: " + error.code);
    }
  });
</script>

{#if process.browser}
  {#if navigator.requestMIDIAccess}
    WebMIDI page
    <pre>{JSON.stringify(config, null, 2)}</pre>
  {:else}
    WebMIDI not supported on this browser.
  {/if}
{/if}

<style lang="scss">
</style>
