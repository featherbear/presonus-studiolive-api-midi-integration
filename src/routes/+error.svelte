<script lang="ts">
  import { Section, Page500 } from "flowbite-svelte-blocks";
  import { page } from "$app/state";
  import { Button } from "flowbite-svelte";
</script>

<Section>
  <Page500>
    {#snippet h1()}{page.status}{/snippet}

    {#snippet paragraph()}
      {#if page.status === 404}
        <p
          class="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl dark:text-white"
        >
          Something's missing.
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          Sorry, we can't find that page. You'll find lots to explore on the
          home page.
        </p>
        <Button href="/" size="lg" color="red">Back to Homepage</Button>
      {:else}
        <p
          class="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl dark:text-white"
        >
          {page.error?.message ?? "Internal Server Error."}
        </p>
        <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          We are already working to solve the problem.
        </p>
      {/if}
    {/snippet}
  </Page500>
</Section>
