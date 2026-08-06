<script lang="ts">
  import { Section } from "flowbite-svelte-blocks";
  import {
    Card,
    Modal,
    Button,
    Input,
    Label,
    Select,
    Toggle,
  } from "flowbite-svelte";
  import type { SelectOptionType } from "flowbite-svelte";
  import { client } from "$lib/rpc/client";
  import type { DeviceControllerInteropWithConfig } from "$lib/types/DeviceControllerInterop";
  import type { FaderPortConfig } from "../../../../controllers/presonus/faderport/config";

  type ChannelType =
    | "MONO"
    | "MASTER"
    | "LINE"
    | "RETURN"
    | "FXRETURN"
    | "TALKBACK"
    | "AUX"
    | "FX"
    | "SUB"
    | "MAIN"
    | "DCA";

  type ChannelAssignment = {
    channel: {
      type: ChannelType;
      channel?: number;
      mixType?: "AUX" | "FX";
      mixNumber?: number;
    };
    override?: {
      name?: string;
    };
  };

  type ChannelPage = (ChannelAssignment | undefined)[];

  const channelTypeOptions = [
    { name: "Mono", value: "MONO" },
    { name: "Master", value: "MASTER" },
    { name: "Line", value: "LINE" },
    { name: "Return", value: "RETURN" },
    { name: "FX Return", value: "FXRETURN" },
    { name: "Talkback", value: "TALKBACK" },
    { name: "Aux", value: "AUX" },
    { name: "FX", value: "FX" },
    { name: "Sub", value: "SUB" },
    { name: "Main", value: "MAIN" },
    { name: "DCA", value: "DCA" },
  ] satisfies SelectOptionType<ChannelType>[];

  const mixTypeOptions = [
    { name: "Main", value: "MAIN" },
    { name: "Aux mix", value: "AUX" },
    { name: "FX mix", value: "FX" },
  ] satisfies SelectOptionType<string>[];

  const unnumberedChannelTypes = new Set<ChannelType>(["MAIN", "TALKBACK"]);

  type DeviceControllerDraft = Omit<DeviceControllerInteropWithConfig, "id"> & {
    id?: string;
  };

  let midiConnections = $state(client.midi.getMidiConnections());
  let consoleConnections = $state(client.console.getConsoleConnections());

  let {
    isOpen = $bindable(true),
    controller: oldController,
    onclose,
    onsave,
    ondelete,
  }: {
    isOpen?: boolean;
    controller?: DeviceControllerInteropWithConfig;
    onclose?: () => void;
    onsave: (details: DeviceControllerDraft) => void | Promise<void>;
    ondelete?: (id: string) => void | Promise<void>;
  } = $props();

  function createDefaultConfig(model: 8 | 16): FaderPortConfig {
    return {
      model,
      options: {
        pagesLoop: true,
      },
      pages: [Array.from({ length: model }, () => undefined)] as any,
    };
  }

  function getInitialController(): DeviceControllerDraft {
    return oldController
      ? structuredClone(oldController)
      : {
          id: undefined,
          type: "faderport",
          consoleId: "",
          midiConnectionId: "",
          config: createDefaultConfig(8),
        };
  }

  let controller: DeviceControllerDraft = $state(getInitialController());
  let model = $state(String(getConfig().model));
  let pagesLoop = $state(getConfig().options?.pagesLoop ?? true);
  let activePageIndex = $state(0);
  let confirmDeleteOpen = $state(false);
  let deleteError = $state("");

  function optionsFromConnections(
    connections: { id: string; name?: string }[],
  ): SelectOptionType<string>[] {
    return connections.map((connection) => ({
      name: connection.name || connection.id,
      value: connection.id,
    }));
  }

  function getConfig(): FaderPortConfig {
    if (!controller.config) {
      controller.config = createDefaultConfig(8);
    }
    return controller.config as FaderPortConfig;
  }

  function createEmptyPage(model: 8 | 16): ChannelPage {
    return Array.from({ length: model }, () => undefined);
  }

  function normalizePage(
    page: readonly (ChannelAssignment | undefined)[] | undefined,
    model: 8 | 16,
  ): ChannelPage {
    return Array.from({ length: model }, (_, index) => page?.[index]);
  }

  function getInitialPages(): ChannelPage[] {
    const config = getConfig();
    return (config.pages?.length ? config.pages : [createEmptyPage(config.model)]).map(
      (page) => normalizePage(page, config.model),
    );
  }

  let pages = $state<ChannelPage[]>(getInitialPages());

  function normalizeConfig() {
    const config = getConfig();
    config.model = Number(model) === 16 ? 16 : 8;
    config.options = {
      ...config.options,
      pagesLoop,
    };
    pages = (pages.length ? pages : [createEmptyPage(config.model)]).map((page) =>
      normalizePage(page, config.model),
    );
    config.pages = pages as unknown as FaderPortConfig["pages"];
  }

  function shouldShowChannelNumber(type: ChannelType) {
    return !unnumberedChannelTypes.has(type);
  }

  function getPages() {
    return pages;
  }

  function setPages(nextPages: ChannelPage[]) {
    const config = getConfig();
    pages = (nextPages.length ? nextPages : [createEmptyPage(config.model)]).map((page) =>
      normalizePage(page, config.model),
    );
    config.pages = pages as unknown as FaderPortConfig["pages"];
    activePageIndex = Math.min(activePageIndex, pages.length - 1);
  }

  function addPage() {
    const config = getConfig();
    setPages([...getPages(), createEmptyPage(config.model)]);
    activePageIndex = getPages().length - 1;
  }

  function removePage(pageIndex: number) {
    const pages = getPages();
    if (pages.length <= 1) {
      return;
    }

    setPages(pages.filter((_, index) => index !== pageIndex));
    activePageIndex = Math.max(0, Math.min(pageIndex - 1, getPages().length - 1));
  }

  function selectPage(pageIndex: number) {
    activePageIndex = Math.max(0, Math.min(pageIndex, getPages().length - 1));
  }

  function previousPage() {
    selectPage(activePageIndex - 1);
  }

  function nextPage() {
    selectPage(activePageIndex + 1);
  }

  function duplicatePage(pageIndex: number) {
    const currentPages = $state.snapshot(getPages());
    const page = currentPages[pageIndex];
    setPages([
      ...currentPages.slice(0, pageIndex + 1),
      structuredClone(page),
      ...currentPages.slice(pageIndex + 1),
    ]);
    activePageIndex = pageIndex + 1;
  }

  function ensureAssignment(pageIndex: number, slotIndex: number) {
    const pages = getPages();
    pages[pageIndex][slotIndex] ??= {
      channel: {
        type: "LINE",
        channel: slotIndex + 1,
      },
    };
    setPages(pages);
    return pages[pageIndex][slotIndex]!;
  }

  function clearAssignment(pageIndex: number, slotIndex: number) {
    const pages = getPages();
    pages[pageIndex][slotIndex] = undefined;
    setPages(pages);
  }

  function updateChannelType(pageIndex: number, slotIndex: number, type: ChannelType) {
    const assignment = ensureAssignment(pageIndex, slotIndex);
    assignment.channel = {
      ...assignment.channel,
      type,
    };

    if (shouldShowChannelNumber(type)) {
      assignment.channel.channel ??= slotIndex + 1;
    } else {
      assignment.channel.channel = undefined;
    }
  }

  function updateChannelNumber(
    pageIndex: number,
    slotIndex: number,
    value: string | number,
  ) {
    const assignment = ensureAssignment(pageIndex, slotIndex);
    assignment.channel.channel = Math.max(1, Number(value) || 1);
  }

  function updateMixType(pageIndex: number, slotIndex: number, value: string) {
    const assignment = ensureAssignment(pageIndex, slotIndex);
    if (value === "AUX" || value === "FX") {
      assignment.channel.mixType = value;
      assignment.channel.mixNumber ??= 1;
      return;
    }

    assignment.channel.mixType = undefined;
    assignment.channel.mixNumber = undefined;
  }

  function updateMixNumber(pageIndex: number, slotIndex: number, value: string | number) {
    const assignment = ensureAssignment(pageIndex, slotIndex);
    assignment.channel.mixNumber = Math.max(1, Number(value) || 1);
  }

  function updateOverrideName(pageIndex: number, slotIndex: number, value: string) {
    const assignment = ensureAssignment(pageIndex, slotIndex);
    const name = value.trim();
    assignment.override = name ? { name } : undefined;
  }

  function updateModel(value: string) {
    model = value;
    const nextModel = Number(value) === 16 ? 16 : 8;
    const config = getConfig();
    if (config.model !== nextModel) {
      config.model = nextModel;
      setPages(getPages().map((page) => normalizePage(page, nextModel)));
    }
  }

  const handleUpdate = async () => {
    normalizeConfig();
    await onsave($state.snapshot(controller));
  };

  const handleDelete = async () => {
    if (!oldController?.id || !ondelete) return;

    deleteError = "";
    try {
      await ondelete(oldController.id);
      confirmDeleteOpen = false;
    } catch (error) {
      deleteError = error instanceof Error ? error.message : "Failed to delete controller.";
    }
  };
</script>

<Section sectionClass="h-96">
  <Modal
    title={oldController ? "Edit Controller" : "Create Controller"}
    bind:open={isOpen}
    size="xl"
    bodyClass="overflow-hidden"
    {onclose}
  >
    <form class="flex max-h-[75vh] flex-col gap-4 overflow-hidden" onsubmit={(e) => e.preventDefault()}>
      <div class="grid min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div class="space-y-4 overflow-y-auto pr-1">
          <div class="grid gap-4">
            <div>
              <Label>
                Controller Type
                <Select
                  class="mt-2"
                  items={[{ name: "PreSonus FaderPort", value: "faderport" }]}
                  bind:value={controller.type}
                  required
                />
              </Label>
            </div>

            <div>
              <Label>
                FaderPort Model
                <Select
                  class="mt-2"
                  items={[
                    { name: "FaderPort 8", value: "8" },
                    { name: "FaderPort 16", value: "16" },
                  ]}
                  value={model}
                  onchange={(event) => updateModel(event.currentTarget.value)}
                  required
                />
              </Label>
            </div>
          </div>

          <div class="grid gap-4">
            <div>
              {#await midiConnections then connections}
                <Label>
                  MIDI Device
                  <Select
                    class="mt-2"
                    items={optionsFromConnections(connections)}
                    bind:value={controller.midiConnectionId}
                    required
                  />
                </Label>
              {/await}
            </div>

            <div>
              {#await consoleConnections then connections}
                <Label>
                  Console Connection
                  <Select
                    class="mt-2"
                    items={optionsFromConnections(connections)}
                    bind:value={controller.consoleId}
                    required
                  />
                </Label>
              {/await}
            </div>
          </div>

          <div>
            <Toggle bind:checked={pagesLoop}>Loop pages</Toggle>
          </div>
        </div>

        <div class="min-h-0 min-w-0 space-y-4 overflow-y-auto pr-2 lg:border-l lg:border-gray-200 lg:pl-6 lg:dark:border-gray-700">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Channel Pages
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure which console channel appears on each physical fader slot.
              </p>
            </div>

            <Button type="button" color="alternative" onclick={addPage}>Add page</Button>
          </div>

          <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
            {#each getPages() as _, pageIndex}
              <Button
                type="button"
                size="xs"
                color={pageIndex === activePageIndex ? "blue" : "alternative"}
                onclick={() => selectPage(pageIndex)}
              >Page {pageIndex + 1}</Button>
            {/each}
          </div>

          {#each [getPages()[activePageIndex]] as page}
            <Card class="w-full max-w-none p-3">
              <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                    Page {activePageIndex + 1} of {getPages().length}
                  </h4>
                </div>

                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="xs"
                    color="alternative"
                    disabled={activePageIndex === 0}
                    onclick={previousPage}
                  >Previous</Button>
                  <Button
                    type="button"
                    size="xs"
                    color="alternative"
                    disabled={activePageIndex === getPages().length - 1}
                    onclick={nextPage}
                  >Next</Button>
                  <Button
                    type="button"
                    size="xs"
                    color="alternative"
                    onclick={() => duplicatePage(activePageIndex)}
                  >Duplicate</Button>
                  {#if getPages().length > 1}
                    <Button
                      type="button"
                      size="xs"
                      outline
                      color="red"
                      onclick={() => removePage(activePageIndex)}
                    >Remove</Button>
                  {/if}
                </div>
              </div>

              <div class="space-y-2">
                {#each page as assignment, slotIndex}
                  <div class="rounded-md border border-gray-200 p-2 dark:border-gray-700">
                    {#if assignment}
                      <div class="space-y-2">
                        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-[3rem_minmax(0,8rem)_minmax(0,7rem)_minmax(0,8rem)_minmax(0,6rem)_minmax(0,1fr)] xl:items-center">
                          <div class="flex items-center gap-2 xl:block">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Slot
                            </span>
                            <span class="font-semibold text-gray-900 dark:text-white">
                              {slotIndex + 1}
                            </span>
                          </div>

                          <div>
                            <Label class="text-xs">
                              Type
                              <Select
                                class="mt-1"
                                items={channelTypeOptions}
                                value={assignment.channel.type}
                                onchange={(event) =>
                                  updateChannelType(
                                    activePageIndex,
                                    slotIndex,
                                    event.currentTarget.value as ChannelType,
                                  )}
                              />
                            </Label>
                          </div>

                          <div>
                            <Label class="text-xs">
                              Channel
                              <Input
                                class="mt-1"
                                type="number"
                                min="1"
                                disabled={!shouldShowChannelNumber(assignment.channel.type)}
                                value={assignment.channel.channel ?? 1}
                                onchange={(event) =>
                                  updateChannelNumber(
                                    activePageIndex,
                                    slotIndex,
                                    event.currentTarget.value,
                                  )}
                              />
                            </Label>
                          </div>

                          <div>
                            <Label class="text-xs">
                              Mix target
                              <Select
                                class="mt-1"
                                items={mixTypeOptions}
                                value={assignment.channel.mixType ?? "MAIN"}
                                onchange={(event) =>
                                  updateMixType(activePageIndex, slotIndex, event.currentTarget.value)}
                              />
                            </Label>
                          </div>

                          <div>
                            <Label class="text-xs">
                              Mix #
                              <Input
                                class="mt-1"
                                type="number"
                                min="1"
                                disabled={!assignment.channel.mixType}
                                value={assignment.channel.mixNumber ?? 1}
                                onchange={(event) =>
                                  updateMixNumber(activePageIndex, slotIndex, event.currentTarget.value)}
                              />
                            </Label>
                          </div>

                          <div class="sm:col-span-2 xl:col-span-1">
                            <Label class="text-xs">
                              Display override
                              <Input
                                class="mt-1"
                                type="text"
                                value={assignment.override?.name ?? ""}
                                placeholder="Use console name"
                                onchange={(event) =>
                                  updateOverrideName(
                                    activePageIndex,
                                    slotIndex,
                                    event.currentTarget.value,
                                  )}
                              />
                            </Label>
                          </div>
                        </div>

                        <div class="flex justify-end">
                          <Button
                            type="button"
                            size="xs"
                            class="shrink-0 whitespace-nowrap"
                            outline
                            color="red"
                            onclick={() => clearAssignment(activePageIndex, slotIndex)}
                          >Clear</Button>
                        </div>
                      </div>
                    {:else}
                      <div class="flex min-w-0 items-center gap-2">
                        <div class="flex shrink-0 items-center gap-2">
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Slot
                          </span>
                          <span class="font-semibold text-gray-900 dark:text-white">
                            {slotIndex + 1}
                          </span>
                        </div>

                        <p class="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          Empty slot
                        </p>

                        <Button
                          type="button"
                          size="xs"
                          class="shrink-0 whitespace-nowrap"
                          color="alternative"
                          onclick={() => ensureAssignment(activePageIndex, slotIndex)}
                        >Assign</Button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </Card>
          {/each}
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:justify-between">
        {#if oldController?.id && ondelete}
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
          >Save controller</Button
        >
      </div>
    </form>
  </Modal>

  <Modal title="Delete controller?" bind:open={confirmDeleteOpen} size="xs">
    <div class="space-y-4">
      <p class="text-gray-700 dark:text-gray-300">
        Delete {oldController?.type || "this controller"}? This removes it from saved settings and disconnects its live handlers.
      </p>
      {#if deleteError}
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {deleteError}
        </p>
      {/if}
      <div class="flex justify-end gap-3">
        <Button type="button" color="alternative" onclick={() => (confirmDeleteOpen = false)}>Cancel</Button>
        <Button type="button" color="red" onclick={handleDelete}>Delete controller</Button>
      </div>
    </div>
  </Modal>
</Section>
