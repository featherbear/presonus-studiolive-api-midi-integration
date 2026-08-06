<script lang="ts">
  import { Badge, Button, Card, Heading, Spinner } from "flowbite-svelte";
  import type { PageData } from "./$types";

  type HealthResult = {
    status: boolean;
    message?: string;
    data?: unknown;
  };

  type HealthEntry = {
    title: string;
    description?: string;
    result: HealthResult | Promise<HealthResult>;
  };

  type HealthItem = {
    state?: unknown;
    [key: string]: unknown;
  };

  const { data }: { data: PageData } = $props();

  const entries = $derived(Object.entries(data) as [string, HealthEntry][]);
  let expandedJson: Record<string, boolean> = $state({});

  function getDataCount(value: unknown) {
    if (!value || typeof value !== "object") return undefined;
    return Object.keys(value).length;
  }

  function getDataEntries(value: unknown) {
    if (!value || typeof value !== "object") return [];
    return Object.entries(value) as [string, HealthItem][];
  }

  function getStateText(state: unknown) {
    return typeof state === "string" && state ? state : "unknown";
  }

  function getStateBadgeColor(state: unknown) {
    const value = getStateText(state);
    if (value === "connected" || value === "registered") return "green";
    if (value === "reconnecting") return "yellow";
    return "red";
  }

  function getStateSummary(value: unknown) {
    const counts = new Map<string, number>();
    for (const [, item] of getDataEntries(value)) {
      const state = getStateText(item.state);
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([state, count]) => `${count} ${state}`)
      .join(" / ");
  }

  function toggleJson(key: string) {
    expandedJson[key] = !expandedJson[key];
  }

  function getItemLabel(key: string, count: number) {
    if (key === "consoles") return count === 1 ? "mixer" : "mixers";
    if (key === "midi") return count === 1 ? "MIDI device" : "MIDI devices";
    if (key === "controllers") return count === 1 ? "controller" : "controllers";
    return count === 1 ? "item" : "items";
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <Heading tag="h1" class="mb-2 text-4xl font-extrabold">
        System Status
      </Heading>
      <p class="text-gray-600 dark:text-gray-300">
        Runtime health for the web server, StudioLive consoles, MIDI devices, and controllers.
      </p>
    </div>

    <Button href="/health.json" color="alternative">View JSON</Button>
  </div>

  <div class="grid gap-4">
    {#each entries as [key, entry]}
      <Card class="w-full max-w-none p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading tag="h2" class="mb-1 text-2xl font-bold">
              {entry.title}
            </Heading>
            {#if entry.description}
              <p class="text-gray-600 dark:text-gray-300">{entry.description}</p>
            {/if}
          </div>

        </div>

        <div class="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          {#await entry.result}
            <div class="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <Spinner size="5" />
              <span>Checking {entry.title.toLowerCase()}...</span>
            </div>
          {:then result}
            {#if result.message}
              <p class="mb-3 text-sm text-gray-700 dark:text-gray-300">
                {result.message}
              </p>
            {/if}

            {#if getDataCount(result.data) !== undefined}
              <div class="mb-4 space-y-3">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getDataCount(result.data)} {getItemLabel(key, getDataCount(result.data) ?? 0)}{#if getStateSummary(result.data)}
                    <span class="text-gray-400 dark:text-gray-500">
                      • {getStateSummary(result.data)}
                    </span>
                  {/if}
                </p>

                {#if getDataEntries(result.data).length > 0}
                  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {#each getDataEntries(result.data) as [itemKey, item]}
                      <div
                        class="flex min-w-0 items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm dark:bg-gray-900"
                      >
                        <span class="min-w-0 truncate font-medium text-gray-700 dark:text-gray-200">
                          {itemKey}
                        </span>
                        <Badge color={getStateBadgeColor(item.state)}>
                          {getStateText(item.state)}
                        </Badge>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <div class="space-y-2">
              <Button
                type="button"
                size="xs"
                color="alternative"
                class="w-fit"
                onclick={() => toggleJson(key)}
              >
                {expandedJson[key] ? "Hide JSON response" : "Show JSON response"}
              </Button>

              {#if expandedJson[key]}
                <pre class="overflow-auto rounded-md bg-white p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100">{JSON.stringify(result, null, 2)}</pre>
              {/if}
            </div>
          {:catch error}
            <p class="text-sm text-red-700 dark:text-red-400">
              {error instanceof Error ? error.message : "Health check failed"}
            </p>
          {/await}
        </div>
      </Card>
    {/each}
  </div>
</div>
