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

  async function deleteController(id: string) {
    await client.controller.deleteDeviceController({ id });
    refreshControllers();
  }
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-2">
      <Heading tag="h2" class="text-4xl font-extrabold">Controllers</Heading>
      <p class="text-gray-600 dark:text-gray-400">
        Assign MIDI devices to consoles and configure the channel pages shown on each controller.
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
              await saveController(details);
              unmount(editDialog);
            },
          },
        });
      }}>Add controller</Button
    >
  </div>

  {#await controllers then controllers}
    <div class="grid gap-4">
      {#each controllers as controller (controller.id)}
        <Card class="w-full max-w-none p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-3">
              <h5 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {controller.type}
              </h5>
              <div class="space-y-1 text-gray-700 dark:text-gray-400">
                <p>MIDI device: {controller.midiConnectionId}</p>
                <p>Console connection: {controller.consoleId}</p>
              </div>
            </div>

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
                    ondelete: async (id) => {
                      await deleteController(id);
                      unmount(editDialog);
                    },
                  },
                });
              }}
            >
              Edit controller
            </Button>
          </div>
        </Card>
      {/each}
    </div>
  {/await}
</section>
