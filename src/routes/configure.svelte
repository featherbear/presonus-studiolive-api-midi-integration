<script context="module">
  export async function preload(page, session) {

    const map = this.fetch("data/map.json").then((r) => r.json());
    const midiDevices = this.fetch("data/midiDevices.json").then((r) => r.json());

    return {
      map: await map,
      midiDevices: await midiDevices
    };
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import ControllerRow from "../components/configure/ControllerRow.svelte";
  import NoteRow from "../components/configure/NoteRow.svelte";

  import type config from "../server/config";
  
  import type DeviceJSON from "./data/_DeviceJSON";
  import type MapJSON from "./data/_MapJSON";

  export let map: MapJSON;
  export let midiDevices: DeviceJSON;

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

<select bind:value={midiDevices.active.device}>
  {#each midiDevices.devices as midiDeviceEntry}
  <option value={midiDeviceEntry}>{midiDeviceEntry}</option>
  {/each}
</select>

<p>MIDI Device: {midiDevices.active.device}</p>
<p>MIDI Channel: {midiDevices.active.channel}</p>

<section>
  <h1>MIDI Events</h1>

</section>

<table>
  <thead>
    <tr>
      <th>MIDI CC</th>
      <th>Behaviour</th>
      <th>Target</th>
    </tr>
  </thead>
  <tbody>
    {#each currentMap.controllers as data}
      <ControllerRow {data} />
    {/each}
    <!-- <ControllerRow
      class="newEntry"
      on:change={({ detail: { data, reset } }) => {
        currentMap.controllers = [...currentMap.controllers, data];
        reset();
      }}
    /> -->
  </tbody>
</table>

<h1>MIDI Note</h1>
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
    <NoteRow
      class="newEntry"
      on:change={({ detail: { data, reset } }) => {
        currentMap.notes = [...currentMap.notes, data];
        reset();
      }}
    />
  </tbody>
</table>

<button on:click={handleSave}>Save</button>

<style lang="scss">
  :global(.newEntry) {
    opacity: 0.3;
    transition: opacity 0.2s;
    &:hover {
      opacity: 1;
    }
  }
</style>
