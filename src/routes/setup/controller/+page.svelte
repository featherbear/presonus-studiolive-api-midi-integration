<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Button, Card, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, unmount } from "svelte";
  import type { DeviceControllerInteropWithConfig } from "$lib/types/DeviceControllerInterop";

  let controllers = $state(client.controller.getDeviceControllers());

  type DeviceControllerDraft = Omit<DeviceControllerInteropWithConfig, "id"> & {
    id?: string;
  };

  function refreshControllers() {
    controllers = client.controller.getDeviceControllers();
  }

  async function saveController(details: DeviceControllerDraft) {
    await client.controller.saveDeviceController(details);
    refreshControllers();
  }
</script>

<Heading tag="h2" class="text-4xl font-extrabold ">Controllers</Heading>

{#await controllers then controllers}
  {#each controllers as controller (controller.id)}
    <Card class="p-4 sm:p-6 md:p-8">
      <h5
        class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {controller.type}
      </h5>
      <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
        MIDI connection: {controller.midiConnectionId}
      </p>
      <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
        Console connection: {controller.consoleId}
      </p>
      <Button
        class="w-fit"
        onclick={() => {
          const editDialog = mount(Edit, {
            target: document.body,
            props: {
              controller,
              onclose: () => unmount(editDialog),
              onsave: async (details) => {
                await saveController(details);
                unmount(editDialog);
              },
            },
          });
        }}
      >
        Edit controller
      </Button>
    </Card>
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
            await saveController(details);
            unmount(editDialog);
          },
        },
      });
    }}>Add Controller</Button
  >
</div>
