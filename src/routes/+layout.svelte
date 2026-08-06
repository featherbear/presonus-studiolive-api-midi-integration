<script lang="ts">
  import "../app.css";
  import Nav from "$lib/ui/Nav.svelte";
</script>

<Nav />

<main>
  <slot />
</main>

<style>
  main {
    position: relative;
    max-width: 56em;
    background-color: white;
    padding: 2em;
    margin: 1.5rem auto 0;
    box-sizing: border-box;
  }
</style>
