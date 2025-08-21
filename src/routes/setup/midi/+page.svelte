<script lang="ts">
  import { client } from "$lib/rpc/client";
  client.midi.discoverMidiPorts();

  import { Alert, Button, Card, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, unmount } from "svelte";
  import { connect } from "socket.io-client";

  let connections = $state(client.midi.getMidiConnections());
</script>

<Heading tag="h2" class="text-4xl font-extrabold ">Devices</Heading>


{#await connections then connections}
  {#each connections as connection (connection.id)}
    <Card class="p-4 sm:p-6 md:p-8">
      <h5
        class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {connection.name ?? "No name"}
      </h5>
      <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
        Input: {connection.input}
      </p>
      <p class="leading-tight font-normal text-gray-700 dark:text-gray-400">
        Output: {connection.output ?? "(no port)"}
      </p>
      <Button
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
          onsave: (details) => {
            console.log("Details saved:", details);
          },
        },
      });
    }}>Add Device</Button
  >
</div>
