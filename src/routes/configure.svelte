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
  import type config from "../server/config";
  export let map: typeof config;
  export let device: { device: string; channel: number };

  let currentMap = {
    controllers: Object.entries(map.controllers),
    notes: Object.entries(map.notes),
  };

  import * as configTypes from "../types/configTypes";

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
    {#each currentMap.controllers as [controlID, { type, selector }], idx}
      <tr>
        <td>
          <input type="number" bind:value={controlID} min="0" max="127" />
        </td>
        <td>
          <select bind:value={type}>
            {#each configTypes.ControllerType as type}
              <option value={type}
                >{type.replace(/^(.)/g, (f) => f.toUpperCase())}</option
              >
            {/each}
          </select>
          {type}</td
        >
        <td>{JSON.stringify(selector)}</td>
      </tr>
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
    {#each currentMap.notes as [noteID, { latch, onPress, onRelease, selector }], idx}
      <tr>
        <td>
          <input type="number" bind:value={noteID} min="0" max="127" />
        </td>
        <td>
          <input type="checkbox" bind:checked={latch} />
        </td>
        <td>
          <select bind:value={onPress}>
            {#each configTypes.NoteAction as action}
              <option value={action}
                >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
              >
            {/each}
          </select>
        </td>

        <td>
          <select bind:value={onRelease}>
            {#each configTypes.NoteAction as action}
              <option value={action}
                >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
              >
            {/each}
          </select>
        </td>
        <td>{JSON.stringify(selector)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<button on:click={handleSave}>Save</button>
