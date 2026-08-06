<script lang="ts">
  import { Section } from "flowbite-svelte-blocks";
  import {
    Modal,
    Button,
    Input,
    Label,
    Dropdown,
    DropdownItem,
  } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";

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
    onsave: (details: ConsoleConnectionInterop_Partial) => Promise<void> | void;
  } = $props();

  type ConsoleConnectionInterop_Partial = Omit<
    ConsoleConnectionInterop,
    "id"
  > & {
    id?: string;
  };

  type EditableConsoleConnection = Omit<
    ConsoleConnectionInterop_Partial,
    "address"
  > & {
    address: NonNullable<ConsoleConnectionInterop["address"]>;
  };

  type ConnectionMode = "serial" | "address";

  function getInitialConnection(): EditableConsoleConnection {
    const connection: Omit<EditableConsoleConnection, "address"> & {
      address?: EditableConsoleConnection["address"];
    } = oldConnection
      ? structuredClone(oldConnection)
      : { id: undefined, name: "" };

    return {
      ...connection,
      address: connection.address ?? {
        host: "",
        port: 53000,
      },
    };
  }

  function getInitialConnectionMode(): ConnectionMode {
    return oldConnection?.serial ? "serial" : "address";
  }

  let connection: EditableConsoleConnection = $state(
    getInitialConnection(),
  );
  let connectionMode: ConnectionMode = $state(getInitialConnectionMode());
  let discoveredDropdownOpen = $state(false);

  const handleUpdate = async () => {
    const snapshot = $state.snapshot(connection!);
    const payload: ConsoleConnectionInterop_Partial = {
      id: snapshot.id,
      name: snapshot.name,
    };

    if (connectionMode === "serial") {
      payload.serial = snapshot.serial?.trim();
      if (snapshot.address.host) {
        payload.address = snapshot.address;
      }
    } else {
      payload.address = snapshot.address;
    }

    await onsave(payload);
  };
  const handleDelete = () => {
    alert("Clicked delete.");
  };
</script>

<!-- FIXME: Unmount component on close -->
<Section sectionClass="h-96">
  <Modal
    title={oldConnection ? "Edit console" : "Create console"}
    bind:open={isOpen}
    {onclose}
  >
    <form onsubmit={(e) => e.preventDefault()}>
      <div class="mb-4">
        <div>
          <Label for="name" class="mb-2">Name</Label>
          <Input type="text" id="name" bind:value={connection.name} required />
        </div>
      </div>

      <div class="mb-4">
        <Label class="mb-2">Connection method</Label>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            color={connectionMode === "serial" ? "blue" : "light"}
            onclick={() => (connectionMode = "serial")}
          >
            Serial (auto discovery)
          </Button>
          <Button
            type="button"
            color={connectionMode === "address" ? "blue" : "light"}
            onclick={() => (connectionMode = "address")}
          >
            IP + Port
          </Button>
        </div>
      </div>

      {#if connectionMode === "serial"}
        <div class="mb-4">
          <Label>
            Serial
            <Input
              type="text"
              id="serial"
              bind:value={connection.serial}
              required
            />
          </Label>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The current discovered address is saved as a fallback, but future
            connections will follow this serial if the console IP changes.
          </p>
        </div>
      {:else}
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
                type="number"
                id="port"
                bind:value={connection.address.port}
                required
              />
            </Label>
          </div>
        </div>
      {/if}

      <div class="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          {#if discovered.length > 0}
            <Button onclick={(e: MouseEvent) => e.stopPropagation()}>
              Load from discovered device<ChevronDownOutline
                class="ms-2 h-6 w-6 text-white dark:text-white"
              /></Button
            >
            <Dropdown simple bind:isOpen={discoveredDropdownOpen}>
              {#each discovered as result}
                <DropdownItem>
                  <Button
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      if (connectionMode === "serial") {
                        connection.serial = result.serial;
                      } else {
                        connection.address.host = result.ip;
                        connection.address.port = result.port;
                      }
                      discoveredDropdownOpen = false;
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
