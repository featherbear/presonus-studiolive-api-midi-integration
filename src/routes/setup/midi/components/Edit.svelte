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
  }: {
    isOpen?: boolean;
    connection?: MidiConnectionInterop;
    onclose?: () => void;
    onsave: (details: MidiConnectionInterop_Partial) => void | Promise<void>;
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

  const handleUpdate = async () => {
    const details = $state.snapshot(connection!);
    await onsave({
      ...details,
      output: details.output || undefined,
    });
  };
  const handleDelete = () => {
    alert("Clicked delete.");
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
