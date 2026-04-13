<script lang="ts">
  const { data } = $props();
</script>

<div class="container">
  <h1>System Status</h1>

  {#each Object.entries(data) as [key, value]}
    <div class="status-item">
      <p><strong>{value.title}</strong> ({value.description})</p>
      <div>
        {#await value.result}
          ...
        {:then result}
          {JSON.stringify(result, null, 2)}
        {/await}
      </div>
    </div>
  {/each}
</div>
