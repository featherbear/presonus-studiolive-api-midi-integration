<script context="module">
  export function preload(_, session) {
    if (!session.capabilities.webmidi) {
      return this.error(405, "WebMIDI is not enabled by the server");
    }
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";

  /**
   * When a MIDI control is made, raw MIDI bytes are transmitted over the WebSockets connection
   * The server then receives and processes the MIDI bytes, possibly calling the StudioLive API
   * The API may emit events which are handled and emitted as MIDI events to the virtual MIDI device
   *   whose MIDI bytes are then received by the web client via WebSockets.
   * There can exist a decent delay between this roundtrip, so we will ignore any received MIDI bytes
   *   of a channel that was recently touched by the MIDI device
   */

  type Timeout = number;
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
    #extractIdentifier(bytes: Uint8Array) {
      return bytes[0];
    }

    queue(bytes: Uint8Array, callback: Function) {
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
    touch(bytes: Uint8Array) {
      let identifier = this.#extractIdentifier(bytes);
      
      // Expire existing debounce timer
      if (this.#locks[identifier]) clearTimeout(this.#locks[identifier]);

      this.#locks[identifier] = setTimeout(() => {
        let callback = this.#queue[identifier];

        // Fire callback asynchronously if it exists
        if (callback) {
          delete this.#queue[identifier];
          
          console.debug('(callback) Asserting state');
          (async () => callback())();
        }

        // Cleanup
        delete this.#locks[identifier];
      }, 500);
    }
  })();

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
          console.debug("Sending MIDI bytes", data);
          debouncer.touch(data);
          client.send(data);
        });
      }

      client.on("message", function (data) {
        console.debug("Received MIDI bytes", data);
        // TODO: Select which MIDI device is in use

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
  {:else}
    WebMIDI not supported on this browser.
  {/if}
{/if}

<style lang="scss">
</style>
