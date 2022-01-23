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
  import { ControllerType } from "../../types/configTypes";
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
    <select bind:value={data[1].type} on:change={notify}>
      <option value="" disabled />
      {#each ControllerType as type}
        <option value={type}
          >{type.replace(/^(.)/g, (f) => f.toUpperCase())}</option
        >
      {/each}
    </select>
    {data[1].type}</td
  >
  <td>{JSON.stringify(data[1].selector)}</td>
</tr>
