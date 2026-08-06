<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Button, Card } from "flowbite-svelte";
  import { mount, onMount, unmount } from "svelte";
  import type { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";
  import Edit from "./Edit.svelte";

  type ConsoleConnectionDraft = Omit<ConsoleConnectionInterop, "id"> & {
    id?: string;
  };

  let {
    connection,
    onsave,
  }: {
    connection: ConsoleConnectionInterop;
    onsave: (details: ConsoleConnectionDraft) => Promise<void> | void;
  } = $props();

  let status = $state();
  onMount(() => {
    async function updateStatus() {
      status = await client.console
        .getConsoleConnectionStatus({ id: connection.id })
        .then((o) => o.state);
    }

    let interval = setInterval(updateStatus, 3000);
    updateStatus();

    return () => {
      clearInterval(interval);
    };
  });
</script>

<Card class="p-4 sm:p-6 md:p-8">
  <h5
    class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
  >
    {connection.name ?? "No name"}
  </h5>
  {#if connection.serial}
    <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
      Serial: {connection.serial}
    </p>
  {/if}
  <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
    {#if connection.address?.host}
      Address: {connection.address.host}:{connection.address.port ?? 53000}
    {:else}
      Address: Resolved from discovery
    {/if}
  </p>
  Status: {status}
  <Button
    class="mt-4 w-fit"
    onclick={() => {
      const editDialog = mount(Edit, {
        target: document.body,
        props: {
          connection,
          onclose: () => unmount(editDialog),
          onsave: async (details) => {
            await onsave(details);
            unmount(editDialog);
          },
        },
      });
    }}
  >
    Edit console
  </Button>
</Card>
