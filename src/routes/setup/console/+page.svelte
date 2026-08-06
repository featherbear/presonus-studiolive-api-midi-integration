<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Button, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, unmount } from "svelte";
  import ConnectionCard from "./components/ConnectionCard.svelte";
  import type { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";

  let connections = $state(client.console.getConsoleConnections());

  type ConsoleConnectionDraft = Omit<ConsoleConnectionInterop, "id"> & {
    id?: string;
  };

  function refreshConnections() {
    connections = client.console.getConsoleConnections();
  }

  async function saveConnection(details: ConsoleConnectionDraft) {
    await client.console.saveConsoleConnection(details);
    refreshConnections();
  }
</script>

<Heading tag="h2" class="text-4xl font-extrabold ">StudioLive Consoles</Heading>

{#await connections then connections}
  {#each connections as connection (connection.id)}
    <ConnectionCard {connection} onsave={saveConnection} />
  {/each}
{/await}

<div class="mt-8 flex justify-center">
  <Button
    onclick={() => {
      const editDialog = mount(Edit, {
        target: document.body,
        props: {
          onclose: () => unmount(editDialog),
          onsave: async (details) => {
            await saveConnection(details);
            unmount(editDialog);
          },
        },
      });
    }}>Add console</Button
  >
</div>
