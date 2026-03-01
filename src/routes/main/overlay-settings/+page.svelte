<script lang="ts">
  import BasicSettings from "./components/BasicSettings.svelte";
  import SkillSettings from "./components/SkillSettings.svelte";
  import BuffSettings from "./components/BuffSettings.svelte";
  import TestSettings from "./components/TestSettings.svelte";

  let activeTab = $state("basic");

  $effect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab && ["basic", "skills", "buffs", "test"].includes(tab)) {
      activeTab = tab;
    }
  });

  function switchTab(tabId: string): void {
    activeTab = tabId;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  }
</script>

{#if activeTab === "basic"}
  <BasicSettings />
{:else if activeTab === "skills"}
  <SkillSettings />
{:else if activeTab === "buffs"}
  <BuffSettings />
{:else if activeTab === "test"}
  <TestSettings />
{/if}
