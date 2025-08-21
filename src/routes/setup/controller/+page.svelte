<script lang="ts">
  import { client } from "$lib/rpc/client";

  import { Alert, Button, Card, Heading } from "flowbite-svelte";
  import Edit from "./components/Edit.svelte";
  import { mount, onMount, unmount } from "svelte";

  let connections = $state(client.getConsoleConnections());

</script>

<Heading tag="h2" class="text-4xl font-extrabold ">Controllers</Heading>
