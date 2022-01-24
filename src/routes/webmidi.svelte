<script context="module">
  export function preload(_, session) {
    if (!session.capabilities.webmidi) {
      return this.error(405, "WebMIDI is not enabled by the server");
    }
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    let SocketIO = await import("socket.io-client");
    console.log("Connecting to WebSockets WebMIDI tunnel endpoint");
    let client = SocketIO.io("/webmidi", { path: "/s" });

    console.log("Connecting to MIDI controllers");

    try {
      let midiAccess = await navigator.requestMIDIAccess();
      for (let input of midiAccess.inputs.values()) {
        console.log(
          `Found MIDI Input Device: ${[input.manufacturer, input.name]
            .map((s) => s.trim())
            .filter((v) => v)
            .join(" ")}`
        );

        input.addEventListener("midimessage", function ({ data }) {
          console.debug("Sending MIDI bytes", data);
          client.send(data);
        });
      }
    } catch (error) {
      console.error("No MIDI access: " + error.code);
    }
  });
</script>

<style lang="scss">
</style>
