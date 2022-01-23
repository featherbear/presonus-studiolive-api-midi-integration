<script lang="ts">
  export let data;

  import { NoteAction } from "../../types/configTypes";
</script>

<tr>
  <td>
    <input type="number" bind:value={data[0]} min="0" max="127" />
  </td>
  <td>
    <input type="checkbox" bind:checked={data[1].latch} />
  </td>
  <td>
    <select bind:value={data[1].onPress}>
      {#each NoteAction as action}
        <option value={action}
          >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
  </td>

  <td>
    <select bind:value={data[1].onRelease}>
      {#each NoteAction as action}
        <option value={action}
          >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
  </td>
  <td>{JSON.stringify(data[1].selector)}</td>
</tr>
