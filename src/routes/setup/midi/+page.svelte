<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Button, Card, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, unmount } from "svelte";
  import type { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";

  let connections = $state(client.midi.getMidiConnections());

  type MidiConnectionDraft = Omit<MidiConnectionInterop, "id"> & {
    id?: string;
  };

  function refreshConnections() {
    connections = client.midi.getMidiConnections();
  }

  async function saveConnection(details: MidiConnectionDraft) {
    await client.midi.saveMidiConnection(details);
    refreshConnections();
  }

  async function deleteConnection(id: string) {
    await client.midi.deleteMidiConnection({ id });
    refreshConnections();
  }
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-2">
      <Heading tag="h2" class="text-4xl font-extrabold">MIDI Devices</Heading>
      <p class="text-gray-600 dark:text-gray-400">
        Configure the MIDI input and output ports used by your control surfaces.
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
      }}>Add device</Button
    >
  </div>

  {#await connections then connections}
    <div class="grid gap-4">
      {#each connections as connection (connection.id)}
        <Card class="w-full max-w-none p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-3">
              <h5 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {connection.name ?? "No name"}
              </h5>
              <div class="space-y-1 text-gray-700 dark:text-gray-400">
                <p>Input: {connection.input}</p>
                <p>Output: {connection.output ?? "(no port)"}</p>
              </div>
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
                      await saveConnection(details);
                      unmount(editDialog);
                    },
                    ondelete: async (id) => {
                      await deleteConnection(id);
                      unmount(editDialog);
                    },
                  },
                });
              }}
            >
              Edit device
            </Button>
          </div>
        </Card>
      {/each}
    </div>
  {/await}
</section>
