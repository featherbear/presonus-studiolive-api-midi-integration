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
    ondelete,
  }: {
    connection: ConsoleConnectionInterop;
    onsave: (details: ConsoleConnectionDraft) => Promise<void> | void;
    ondelete: (id: string) => Promise<void> | void;
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

<Card class="w-full max-w-none p-6">
  <div class="space-y-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h5 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {connection.name ?? "No name"}
        </h5>
        <p class="text-sm text-gray-500 dark:text-gray-400">Status: {status ?? "checking"}</p>
      </div>

      <Button
        class="w-fit"
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
              ondelete: async (id) => {
                await ondelete(id);
                unmount(editDialog);
              },
            },
          });
        }}
      >
        Edit console
      </Button>
    </div>

    <div class="space-y-1 text-gray-700 dark:text-gray-400">
      {#if connection.serial}
        <p>Serial: {connection.serial}</p>
      {/if}
      <p>
        {#if connection.address?.host}
          Address: {connection.address.host}:{connection.address.port ?? 53000}
        {:else}
          Address: Resolved from discovery
        {/if}
      </p>
    </div>
  </div>
</Card>
