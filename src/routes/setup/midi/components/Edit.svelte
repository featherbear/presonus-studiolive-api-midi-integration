<script lang="ts">
  import { Section } from "flowbite-svelte-blocks";
  import {
    Modal,
    Button,
    Input,
    Label,
    Select,
    type SelectOptionType,
  } from "flowbite-svelte";
  import type { MidiConnectionInterop } from "$lib/types/MidiConnectionInterop";
  import { client } from "$lib/rpc/client";

  let ports = $state(client.midi.discoverMidiPorts());

  let {
    isOpen = $bindable(true),
    connection: oldConnection,
    onclose,
    onsave,
    ondelete,
  }: {
    isOpen?: boolean;
    connection?: MidiConnectionInterop;
    onclose?: () => void;
    onsave: (details: MidiConnectionInterop_Partial) => void | Promise<void>;
    ondelete?: (id: string) => void | Promise<void>;
  } = $props();

  type MidiConnectionInterop_Partial = Omit<MidiConnectionInterop, "id"> & {
    id?: string;
  };

  function getInitialConnection(): MidiConnectionInterop_Partial {
    return oldConnection
      ? structuredClone(oldConnection)
      : {
      id: undefined,
      name: "",
      input: "",
      output: "",
        };
  }

  let connection: MidiConnectionInterop_Partial = $state(getInitialConnection());
  let confirmDeleteOpen = $state(false);
  let deleteError = $state("");

  const handleUpdate = async () => {
    const details = $state.snapshot(connection!);
    await onsave({
      ...details,
      output: details.output || undefined,
    });
  };
  const handleDelete = async () => {
    if (!oldConnection?.id || !ondelete) return;

    deleteError = "";
    try {
      await ondelete(oldConnection.id);
      confirmDeleteOpen = false;
    } catch (error) {
      deleteError = error instanceof Error ? error.message : "Failed to delete MIDI device.";
    }
  };

  const generateSelects = (values: string[], current?: string) => {
    let entries = [...values];
    if (current && !values.includes(current)) {
      entries.push(current);
    }

    let selects: SelectOptionType<string>[] = entries.map((name) => ({
      value: name,
      name: name,
    }));

    let currentSelect = selects.find((o) => o.value === current);
    if (currentSelect) {
      currentSelect.name += " (current)";

      if (!values.includes(current!)) {
        currentSelect.disabled = true;
      }
    }

    return selects.toSorted((a, b) =>
      a.name.toString().localeCompare(b.name.toString())
    );
  };
</script>

<!-- FIXME: Unmount component on close -->
<Section sectionClass="h-96">
  <Modal
    title={oldConnection ? "Edit device" : "Create device"}
    bind:open={isOpen}
    {onclose}
  >
    <form class="space-y-5" onsubmit={(e) => e.preventDefault()}>
      <div>
        <div>
          <Label for="name" class="mb-2">Name</Label>
          <Input type="text" id="name" bind:value={connection.name} required />
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          {#await ports}
            Loading
          {:then portsResult}
            <Label>
              Input MIDI Port
              <Select
                class="mt-2"
                items={generateSelects(
                  portsResult.input,
                  oldConnection?.input ?? undefined,
                )}
                bind:value={connection.input}
                required
              />
            </Label>
          {/await}
        </div>

        <div>
          {#await ports}
            Loading
          {:then portsResult}
            <Label>
              Output MIDI Port
              <Select
                class="mt-2"
                items={[
                  { name: "Disabled", value: "" },
                  ...generateSelects(portsResult.output, oldConnection?.output),
                ]}
                bind:value={connection.output}
                required
              />
            </Label>
          {/await}
        </div>

        <div class="flex flex-wrap items-center gap-3 sm:col-span-2 sm:justify-between">
          {#if oldConnection?.id && ondelete}
            <Button
              type="button"
              class="w-full sm:w-auto"
              outline
              color="red"
              onclick={() => (confirmDeleteOpen = true)}>Delete</Button
            >
          {:else}
            <span></span>
          {/if}
          <Button type="submit" class="w-full sm:w-auto" onclick={handleUpdate}
            >Save connection</Button
          >
        </div>
      </div>
    </form>
  </Modal>

  <Modal title="Delete MIDI device?" bind:open={confirmDeleteOpen} size="xs">
    <div class="space-y-4">
      <p class="text-gray-700 dark:text-gray-300">
        Delete {oldConnection?.name || "this MIDI device"}? This removes it from saved settings and closes the live MIDI ports.
      </p>
      {#if deleteError}
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {deleteError}
        </p>
      {/if}
      <div class="flex justify-end gap-3">
        <Button type="button" color="alternative" onclick={() => (confirmDeleteOpen = false)}>Cancel</Button>
        <Button type="button" color="red" onclick={handleDelete}>Delete device</Button>
      </div>
    </div>
  </Modal>
</Section>
