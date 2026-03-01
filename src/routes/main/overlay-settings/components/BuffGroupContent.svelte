<script lang="ts">
  import type { BuffGroup } from "$lib/settings-store";
  import { uniqueIds, moveItem, normalizeGroupPriorityIds } from "$lib/group-utils";
  import { commands } from "$lib/bindings";
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";

  let {
    group,
    availableBuffs = [],
    monitoredBuffIds = [],
    onUpdate,
  }: {
    group: BuffGroup;
    availableBuffs?: BuffDefinition[];
    monitoredBuffIds?: number[];
    onUpdate?: (groupId: string, updater: (g: BuffGroup) => BuffGroup) => void;
  } = $props();

  const buffNames = $state(new Map<number, BuffNameInfo>());
  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });

  const groupPriorityIds = $derived.by(() => normalizeGroupPriorityIds(group));

  let groupSearchKeyword = $state("");
  let groupSearchResults = $state<BuffNameInfo[]>([]);
  let groupPrioritySearchKeyword = $state("");
  let groupPrioritySearchResults = $state<BuffNameInfo[]>([]);

  function updateGroup(updater: (g: BuffGroup) => BuffGroup): void {
    if (!onUpdate) return;
    onUpdate(group.id, (curr) => {
      const updated = updater(curr);
      return {
        ...updated,
        priorityBuffIds: normalizeGroupPriorityIds(updated),
      };
    });
  }

  function toggleBuffInGroup(buffId: number): void {
    if (!onUpdate) return;
    onUpdate(group.id, (curr) => {
      const exists = curr.buffIds.includes(buffId);
      return {
        ...curr,
        buffIds: exists
          ? curr.buffIds.filter((id) => id !== buffId)
          : [...curr.buffIds, buffId],
        priorityBuffIds: exists
          ? curr.priorityBuffIds.filter((id) => id !== buffId)
          : curr.priorityBuffIds,
      };
    });
  }

  function togglePriorityInGroup(buffId: number): void {
    if (!onUpdate) return;
    onUpdate(group.id, (curr) => {
      const exists = curr.priorityBuffIds.includes(buffId);
      return {
        ...curr,
        priorityBuffIds: exists
          ? curr.priorityBuffIds.filter((id) => id !== buffId)
          : uniqueIds([...curr.priorityBuffIds, buffId]),
      };
    });
  }

  function moveGroupPriority(buffId: number, direction: "up" | "down"): void {
    if (!onUpdate) return;
    onUpdate(group.id, (curr) => ({
      ...curr,
      priorityBuffIds: moveItem(normalizeGroupPriorityIds(curr), buffId, direction),
    }));
  }

  $effect(() => {
    const ids = group.buffIds;
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
    const keyword = groupSearchKeyword.trim();
    if (!keyword) {
      groupSearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupSearchResults = res.data;
    })();
  });

  $effect(() => {
    const keyword = groupPrioritySearchKeyword.trim();
    if (!keyword) {
      groupPrioritySearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupPrioritySearchResults = res.data;
    })();
  });

  function getGroupSearchResults(): BuffNameInfo[] {
    const results = groupSearchResults;
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPrioritySearchResults(): BuffNameInfo[] {
    const results = groupPrioritySearchResults;
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (!group.monitorAll && !group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPriorityIds(): number[] {
    return normalizeGroupPriorityIds(group);
  }
</script>

<div class="space-y-2">
  <input
    class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    placeholder="搜索并添加到此分组"
    bind:value={groupSearchKeyword}
  />
  {#if getGroupSearchResults().length > 0}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
      {#each getGroupSearchResults().slice(0, 40) as item (item.baseId)}
        {@const iconBuff = availableBuffMap.get(item.baseId)}
        <button
          type="button"
          class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
          title={item.name}
          onclick={() => toggleBuffInGroup(item.baseId)}
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
      {/each}
    </div>
  {/if}

  <div class="text-xs text-muted-foreground">
    已分配 Buff（点击可移除）
  </div>
  <div class="flex flex-wrap gap-2">
    {#each group.buffIds as buffId (buffId)}
      {@const iconBuff = availableBuffMap.get(buffId)}
      {@const nameInfo = buffNames.get(buffId)}
      <button
        type="button"
        class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
        title={nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
        onclick={() => toggleBuffInGroup(buffId)}
      >
        {#if iconBuff}
          <img
            src={`/images/buff/${iconBuff.spriteFile}`}
            alt={iconBuff.name}
            class="w-full h-full object-contain"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
            文本
          </div>
        {/if}
      </button>
    {/each}
    {#if group.buffIds.length === 0}
      <div class="text-xs text-muted-foreground">未添加 Buff</div>
    {/if}
  </div>
  <div class="space-y-1">
    <div class="text-xs text-muted-foreground">分组内优先级</div>
    <div class="text-xs text-muted-foreground">
      可搜索组内 Buff 并添加到优先级列表
    </div>
    <input
      class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      placeholder="搜索并添加到优先级列表"
      bind:value={groupPrioritySearchKeyword}
    />
    {#if getGroupPrioritySearchResults().length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
        {#each getGroupPrioritySearchResults().slice(0, 40) as item (item.baseId)}
          {@const iconBuff = availableBuffMap.get(item.baseId)}
          <button
            type="button"
            class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
            title={item.name}
            onclick={() => togglePriorityInGroup(item.baseId)}
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
        {/each}
      </div>
    {/if}
    {#each getGroupPriorityIds() as buffId, idx (buffId)}
      {@const iconBuff = availableBuffMap.get(buffId)}
      {@const nameInfo = buffNames.get(buffId)}
      <div class="flex items-center gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
        <span class="w-6 text-center text-xs text-muted-foreground">{idx + 1}</span>
        {#if iconBuff}
          <img
            src={`/images/buff/${iconBuff.spriteFile}`}
            alt={iconBuff.name}
            class="size-5 object-contain"
          />
        {/if}
        <span class="flex-1 text-xs text-foreground truncate">
          {nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
        </span>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40"
          onclick={() => togglePriorityInGroup(buffId)}
        >
          移除
        </button>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
          onclick={() => moveGroupPriority(buffId, "up")}
          disabled={idx === 0}
        >
          上移
        </button>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
          onclick={() => moveGroupPriority(buffId, "down")}
          disabled={idx === getGroupPriorityIds().length - 1}
        >
          下移
        </button>
      </div>
    {/each}
    {#if getGroupPriorityIds().length === 0}
      <div class="text-xs text-muted-foreground">未设置优先级，按后端默认顺序显示</div>
    {/if}
  </div>
</div>
