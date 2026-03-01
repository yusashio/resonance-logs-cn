<script lang="ts">
  let {
    tabs,
    activeTab,
    onTabChange,
  }: {
    tabs: Array<{ id: string; label: string; icon?: any }>;
    activeTab: string;
    onTabChange: (tabId: string) => void;
  } = $props();
</script>

<div class="border-b border-border/60 bg-muted/20">
  <nav class="flex gap-1 px-4" role="tablist">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        class="relative px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
          {activeTab === tab.id
            ? 'text-foreground border-primary'
            : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border/60'}"
        onclick={() => onTabChange(tab.id)}
      >
        {#if tab.icon}
          <span class="mr-2 inline-flex items-center">
            <svelte:component this={tab.icon} class="w-4 h-4" />
          </span>
        {/if}
        {tab.label}
      </button>
    {/each}
  </nav>
</div>
