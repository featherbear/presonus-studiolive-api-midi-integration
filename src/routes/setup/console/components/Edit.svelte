<script lang="ts">
  import { Section } from "flowbite-svelte-blocks";
  import {
    Modal,
    Button,
    Input,
    Label,
    Select,
    Textarea,
    type SelectOptionType,
    Dropdown,
    DropdownItem,
  } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";

  import type { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";
  import { client } from "$lib/rpc/client";
  import { onMount } from "svelte";
  import type { ConsoleConnectionInterop } from "$lib/types/ConsoleConnectionInterop";

  let discovered: Awaited<ReturnType<typeof refreshDiscovered>> = $state([]);

  async function refreshDiscovered() {
    const result = await client.console.discover();
    discovered = result;
    return result;
  }

  onMount(() => {
    setTimeout(refreshDiscovered, 0);
    let interval = setInterval(refreshDiscovered, 3000);
    return () => clearInterval(interval);
  });

  let {
    isOpen = $bindable(true),
    connection: oldConnection,
    onclose,
    onsave,
  }: {
    isOpen?: boolean;
    connection?: ConsoleConnectionInterop;
    onclose?: () => void;
    onsave: (details: ConsoleConnectionInterop_Partial) => void;
  } = $props();

  type ConsoleConnectionInterop_Partial = Omit<
    ConsoleConnectionInterop,
    "id"
  > & {
    id?: string;
  };

  let connection: ConsoleConnectionInterop_Partial = $state(
    oldConnection ?? {
      id: undefined,
      name: "",
      address: {
        host: "",
        port: 53000,
      },
    }
  );

  const handleUpdate = () => {
    alert("Clicked update.");
    onsave($state.snapshot(connection!));
  };
  const handleDelete = () => {
    alert("Clicked delete.");
  };
</script>

<!-- FIXME: Unmount component on close -->
<Section sectionClass="h-96">
  <Modal
    title={connection ? "Edit Connection" : "Create Connection"}
    bind:open={isOpen}
    autoclose
    {onclose}
  >
    <form onsubmit={(e) => e.preventDefault()}>
      <div class="mb-4">
        <div>
          <Label for="name" class="mb-2">Name</Label>
          <Input type="text" id="name" bind:value={connection.name} required />
        </div>
      </div>

      <div class="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>
            Address
            <Input
              type="text"
              id="address"
              bind:value={connection.address.host}
              required
            />
          </Label>
        </div>

        <div>
          <Label>
            Port
            <Input
              type="text"
              id="port"
              bind:value={connection.address.port}
              required
            />
          </Label>
        </div>
      </div>

      <div class="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          {#if discovered.length > 0}
            <Button onclick={(e: MouseEvent) => e.stopPropagation()}>
              Load from discovered device<ChevronDownOutline
                class="ms-2 h-6 w-6 text-white dark:text-white"
              /></Button
            >
            <Dropdown simple>
              {#each discovered as result}
                <DropdownItem>
                  <Button
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      connection.name = result.serial;
                      connection.address.host = result.ip;
                      connection.address.port = result.port;
                    }}
                  >
                    {result.name} ({result.serial})
                  </Button>
                </DropdownItem>
              {/each}
            </Dropdown>
          {/if}
        </div>

        <div class="flex items-center space-x-4">
          <Button type="submit" class="w-64" onclick={handleUpdate}
            >Save connection</Button
          >
          <Button
            type="submit"
            class="w-52"
            outline
            color="red"
            onclick={handleDelete}>Delete</Button
          >
        </div>
      </div>
    </form>
  </Modal>
</Section>
