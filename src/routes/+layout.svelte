<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import Nav from "$lib/ui/Nav.svelte";
  // onMount(async () => {
  import SocketIO from "socket.io-client";
  
  console.log("Connecting to WebSockets MIDI feedback endpoint");
  
  const client = SocketIO({ path: "/s" });
  
  client.on("feedback", (event) => {
    console.log("Got feedback", event);
  });
</script>

<!-- <Nav {segment} /> -->

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
