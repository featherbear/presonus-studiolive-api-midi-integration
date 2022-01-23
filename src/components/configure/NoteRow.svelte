<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let data = null;
  const reset = () =>
    (data = ["", { latch: false, onPress: "", onRelease: "", selector: null }]);

  if (!data) reset();

  const dispatch = createEventDispatcher();
  function notify() {
    dispatch("change", { data, reset });
  }
  import { NoteAction } from "../../types/configTypes";
</script>

<tr class={`${$$props.class || ""}`}>
  <td>
    <input
      type="number"
      bind:value={data[0]}
      min="0"
      max="127"
      on:change={notify}
    />
  </td>
  <td>
    <input type="checkbox" bind:checked={data[1].latch} on:change={notify} />
  </td>
  <td>
    <select bind:value={data[1].onPress} on:change={notify}>
      <option value="" />
      {#each NoteAction as action}
        <option value={action}
          >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
  </td>

  <td>
    <select bind:value={data[1].onRelease} on:change={notify}>
      <option value="" />
      {#each NoteAction as action}
        <option value={action}
          >{action.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
  </td>
  <td>{JSON.stringify(data[1].selector)}</td>
</tr>
