<script context="module">
  export async function preload() {
    let map = this.fetch("data/map.json").then((r) => r.json());
    return {
      map: await map,
    };
  }
</script>

<script lang="ts">
  import type config from "../server/config";
  export let map: typeof config;

  let currentMap = {
    controllers: Object.entries(map.controllers),
    notes: Object.entries(map.notes),
  };

  $: console.log(currentMap);
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

<h1>Controllers</h1>
<table>
  <thead>
    <tr
      ><th colspan="3">MIDI</th>
      <th colspan="2">StudioLive</th>
    </tr>
    <tr>
      <!-- MIDI -->
      <th>Device</th>
      <th>Channel</th>
      <th>Control</th>
      <!-- StudioLive -->
      <th>Type</th>
      <th>Channel</th>
    </tr>
  </thead>
  <tbody>
    {#each currentMap.controllers as [controlID, { type, selector }], idx}
      <tr>
        <!--  MIDI -->
        <td>device</td>
        <td>
            <input type="number" min="1" max="16">
        </td>
        <td>
          <input type="number" bind:value={controlID} />
          {controlID}
        </td>
        <!-- StudioLive -->
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
{#each configTypes.NoteAction as action}
  {action}
{/each}

{map.controllers}

<button on:click={handleSave}>Save</button>
