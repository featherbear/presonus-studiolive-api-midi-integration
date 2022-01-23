<script lang="ts">
  export let data;
  let [controlID, { type, selector }] = data;

  import { ControllerType } from "../../types/configTypes";
</script>

<tr>
  <td>
    <input type="number" bind:value={data[0]} min="0" max="127" />
  </td>
  <td>
    <select bind:value={data[1].type}>
      {#each ControllerType as type}
        <option value={type}
          >{type.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
    {type}</td
  >
  <td>{JSON.stringify(data[1].selector)}</td>
</tr>
