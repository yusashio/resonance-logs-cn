<script lang="ts">
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";
  import { uniqueIds, moveItem } from "$lib/group-utils";
  import { commands } from "$lib/bindings";

  let {
    availableBuffs = [],
    monitoredBuffIds = [],
    buffPriorityIds = [],
    onUpdateProfile,
  }: {
    availableBuffs?: BuffDefinition[];
    monitoredBuffIds?: number[];
    buffPriorityIds?: number[];
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const buffNames = $state(new Map<number, BuffNameInfo>());
  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });

  const buffPriorityIdsComputed = $derived.by(() => {
    const selected = new Set(monitoredBuffIds);
    return uniqueIds((buffPriorityIds ?? []).filter((id) => selected.has(id)));
  });

  let globalPrioritySearch = $state("");
  let globalPrioritySearchResults = $state<BuffNameInfo[]>([]);

  function toggleGlobalPriority(buffId: number): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => {
      const current = uniqueIds(profile.buffPriorityIds ?? []);
      const exists = current.includes(buffId);
      return {
        ...profile,
        buffPriorityIds: exists ? current.filter((id) => id !== buffId) : [...current, buffId],
      };
    });
  }

  function moveGlobalPriority(buffId: number, direction: "up" | "down"): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffPriorityIds: moveItem(buffPriorityIdsComputed, buffId, direction),
    }));
  }

  $effect(() => {
    const ids = monitoredBuffIds;
    if (ids.length === 0) return;
    void (async () => {
      const missing = ids.filter((id) => !buffNames.has(id));
      if (missing.length === 0) return;
      const res = await commands.getBuffNames(missing);
      if (res.status !== "ok") return;
      const next = new Map(buffNames);
      for (const item of res.data) {
        next.set(item.baseId, item);
      }
      buffNames = next;
    })();
  });

  $effect(() => {
    const keyword = globalPrioritySearch.trim();
    if (!keyword) {
      globalPrioritySearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      globalPrioritySearchResults = res.data;
    })();
  });
</script>

<div class="space-y-2">
  <div class="text-xs font-medium text-foreground">全局 Buff 优先级</div>
  <p class="text-xs text-muted-foreground">
    排在前面的 Buff 优先显示
  </p>
  <input
    class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    placeholder="搜索并添加到全局优先级"
    bind:value={globalPrioritySearch}
  />
  {#if globalPrioritySearch.trim().length > 0 && globalPrioritySearchResults.length > 0}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
      {#each globalPrioritySearchResults as item (item.baseId)}
        {@const iconBuff = availableBuffMap.get(item.baseId)}
        {#if monitoredBuffIds.includes(item.baseId) && !buffPriorityIdsComputed.includes(item.baseId)}
          <button
            type="button"
            class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
            title={item.name}
            onclick={() => toggleGlobalPriority(item.baseId)}
          >
            {#if iconBuff}
              <img
                src={`/images/buff/${iconBuff.spriteFile}`}
                alt={iconBuff.name}
                class="w-full h-10 object-contain"
              />
            {:else}
              <div class="h-10 flex items-center justify-center text-[10px] text-muted-foreground">
                无图标
              </div>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
  <div class="space-y-1">
    {#each buffPriorityIdsComputed as buffId, idx (buffId)}
      {@const iconBuff = availableBuffMap.get(buffId)}
      {@const nameInfo = buffNames.get(buffId)}
      <div class="flex items-center gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
        <span class="w-6 text-center text-xs text-muted-foreground">{idx + 1}</span>
        {#if iconBuff}
          <img
            src={`/images/buff/${iconBuff.spriteFile}`}
            alt={iconBuff.name}
            class="size-6 object-contain"
          />
        {/if}
        <span class="flex-1 text-xs text-foreground truncate">
          {nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
        </span>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40"
          onclick={() => toggleGlobalPriority(buffId)}
        >
          移除
        </button>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
          onclick={() => moveGlobalPriority(buffId, "up")}
          disabled={idx === 0}
        >
          上移
        </button>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
          onclick={() => moveGlobalPriority(buffId, "down")}
          disabled={idx === buffPriorityIdsComputed.length - 1}
        >
          下移
        </button>
      </div>
    {/each}
    {#if buffPriorityIdsComputed.length === 0}
      <div class="text-xs text-muted-foreground">未设置全局优先级，按后端默认顺序显示</div>
    {/if}
  </div>
</div>
