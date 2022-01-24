<script lang="ts">
  import { onMount } from "svelte";

  import Nav from "../components/Nav.svelte";

  export let segment: string;

  onMount(async () => {
    let SocketIO = await import("socket.io-client");
    console.log("Connecting to WebSockets MIDI feedback endpoint");
    let client = SocketIO.io({ path: "/s" });
    client.on("feedback", (event) => {
      console.log("Got feedback", event);
    });
  });
</script>

<Nav {segment} />

<main>
  <slot />
</main>

<style>
  main {
    position: relative;
    max-width: 56em;
    background-color: white;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>
