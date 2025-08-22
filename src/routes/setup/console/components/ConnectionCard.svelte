<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Alert, Button, Card, Heading } from "flowbite-svelte";
  import { mount, onMount, unmount } from "svelte";
  import type { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";

  let { connection }: { connection: ConsoleConnectionInterop } = $props();

  let status = $state();
  onMount(() => {
    async function updateStatus() {
      status = await client.console.getConsoleConnectionStatus({ id: connection.id }).then(o => o.state);
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
  <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
    Address: {connection.address.host}:{connection.address.port}
  </p>
  Status: {status}
  <!-- <Button
        class="w-fit"
        onclick={() => {
          const editDialog = mount(Edit, {
            target: document.body,
            props: {
              connection,
              onclose: () => unmount(editDialog),
              onsave: (details) => {
                console.log("Details saved:", details);
              },
            },
          });
        }}
      >
        Edit connection
      </Button> -->
</Card>
