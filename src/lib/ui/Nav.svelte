<script lang="ts">
  import { page } from "$app/state";
  import {
    Dropdown,
    DropdownItem,
    Navbar,
    NavBrand,
    NavHamburger,
    NavLi,
    NavUl,
  } from "flowbite-svelte";

  const setupLinks = [
    { href: "/setup/console", label: "Consoles" },
    { href: "/setup/midi", label: "MIDI Devices" },
    { href: "/setup/controller", label: "Controllers" },
  ];

  const isSetupActive = () => page.url.pathname.startsWith("/setup");

  const setupActiveClass =
    "bg-primary-700 text-white md:bg-transparent md:text-primary-700 md:dark:bg-transparent md:dark:text-white";
</script>

<Navbar
  navContainerClass="mx-auto max-w-5xl px-6"
  class="relative z-10 border-b border-gray-200 shadow-md dark:border-gray-700"
>
  {#snippet children({ toggle })}
    <NavBrand href="/">
      <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
        StudioLive MIDI
      </span>
    </NavBrand>
    <NavHamburger onclick={toggle} />
    <NavUl activeUrl={page.url.pathname}>
      <NavLi href="/">Home</NavLi>
      <NavLi href="/health">Health</NavLi>
      <NavLi
        id="setup-menu-button"
        class={isSetupActive() ? setupActiveClass : ""}
      >Setup</NavLi>
      <Dropdown
        simple
        activeUrl={page.url.pathname}
        triggeredBy="#setup-menu-button"
        placement="bottom-start"
      >
        {#each setupLinks as link}
          <DropdownItem href={link.href}>{link.label}</DropdownItem>
        {/each}
      </Dropdown>
    </NavUl>
  {/snippet}
</Navbar>
