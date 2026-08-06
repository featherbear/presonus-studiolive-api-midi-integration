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

  async function deleteConnection(id: string) {
    await client.console.deleteConsoleConnection({ id });
    refreshConnections();
  }
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-2">
      <Heading tag="h2" class="text-4xl font-extrabold">StudioLive Consoles</Heading>
      <p class="text-gray-600 dark:text-gray-400">
        Add mixers by serial discovery or a fixed IP address and port.
      </p>
    </div>

    <Button
      class="w-fit"
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

  {#await connections then connections}
    <div class="grid gap-4">
      {#each connections as connection (connection.id)}
        <ConnectionCard
          {connection}
          onsave={saveConnection}
          ondelete={deleteConnection}
        />
      {/each}
    </div>
  {/await}
</section>
