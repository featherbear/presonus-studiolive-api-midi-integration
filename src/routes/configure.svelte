<script context="module">
  export async function preload() {
    let map = this.fetch("data/map.json").then((r) => r.json());
    let device = this.fetch("data/device.json").then((r) => r.json());
    return {
      map: await map,
      device: await device,
    };
  }
</script>

<script lang="ts">
  import ControllerRow from "../components/configure/ControllerRow.svelte";
  import NoteRow from "../components/configure/NoteRow.svelte";
  
  import type config from "../server/config";
  export let map: typeof config;
  export let device: { device: string; channel: number };

  let currentMap = {
    controllers: Object.entries(map.controllers),
    notes: Object.entries(map.notes),
  };

  let lastSelected = {
    midiDevice: null,
    midiChannel: null,
  };

  function handleSave() {
    fetch("data/map.json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        Object.entries(currentMap).reduce(
          (obj, [key, data]) => ({ ...obj, [key]: Object.fromEntries(data) }),
          {}
        )
      ),
    });
  }
</script>

<p>MIDI Device: {device.device}</p>
<p>MIDI Channel: {device.channel}</p>
<h1>Controllers</h1>
<table>
  <thead>
    <tr>
      <th>MIDI</th>
      <th colspan="2">StudioLive</th>
    </tr>
    <tr>
      <th>Control</th>
      <th>Type</th>
      <th>Target</th>
    </tr>
  </thead>
  <tbody>
    {#each currentMap.controllers as data}
      <ControllerRow bind:data />
    {/each}
  </tbody>
</table>

<h1>Notes</h1>
<table>
  <thead>
    <tr>
      <th>MIDI</th>
      <th colspan="4">StudioLive</th>
    </tr>
    <tr>
      <th>Note</th>
      <th>Latch</th>
      <th>On Press</th>
      <th>On Release</th>
      <th>Target</th>
    </tr>
  </thead>
  <tbody>
    {#each currentMap.notes as data}
      <NoteRow {data} />
    {/each}
  </tbody>
</table>

<button on:click={handleSave}>Save</button>
