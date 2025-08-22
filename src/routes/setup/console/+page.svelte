<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Alert, Button, Card, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, onMount, unmount } from "svelte";
  import ConnectionCard from "./components/ConnectionCard.svelte";

  let connections = $state(client.console.getConsoleConnections());
</script>

<Heading tag="h2" class="text-4xl font-extrabold ">Console</Heading>

{#await connections then connections}
  {#each connections as connection (connection.id)}
    <ConnectionCard {connection} />
  {/each}
{/await}

<div class="mt-8 flex justify-center">
  <Button
    onclick={() => {
      const editDialog = mount(Edit, {
        target: document.body,
        props: {
          onclose: () => unmount(editDialog),
          onsave: (details) => {
            console.log("Details saved:", details);
          },
        },
      });
    }}>Add Device</Button
  >
</div>
