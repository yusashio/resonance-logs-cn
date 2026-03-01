<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "../lib/profile-store";
  import { ensureBuffGroups, addBuffGroup, removeBuffGroup, updateBuffGroup } from "../lib/buff-group-store";
  import { toggleBuffInGroup, togglePriorityInGroup, moveGroupPriority, uniqueIds } from "../lib/buff-utils";
  import { commands } from "$lib/bindings";
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const activeProfile = $derived.by(() => getActiveProfile());

  const buffDisplayMode = $derived.by(() => activeProfile.buffDisplayMode ?? "individual");
  const buffGroups = $derived.by(() => ensureBuffGroups(activeProfile.buffGroups));

  let availableBuffs = $state<BuffDefinition[]>([]);
  let buffNames = $state(new Map<number, BuffNameInfo>());
  let groupSearchKeywords = $state<Record<string, string>>({});
  let groupSearchResults = $state<Record<string, BuffNameInfo[]>>({});
  let groupPrioritySearchKeywords = $state<Record<string, string>>({});
  let groupPrioritySearchResults = $state<Record<string, BuffNameInfo[]>>({});

  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });

  $effect(() => {
    void (async () => {
      const res = await commands.getAvailableBuffs();
      if (res.status === "ok") {
        availableBuffs = res.data;
      }
    })();
  });

  $effect(() => {
    const allBuffIds = new Set<number>();
    for (const group of buffGroups) {
      for (const id of group.buffIds) allBuffIds.add(id);
      for (const id of group.priorityBuffIds) allBuffIds.add(id);
    }
    if (allBuffIds.size === 0) return;
    void (async () => {
      const missing = Array.from(allBuffIds).filter((id) => !buffNames.has(id));
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

  function addBuffGroupAction(): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: addBuffGroup(profile.buffGroups),
    }));
  }

  function removeBuffGroupAction(groupId: string): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: removeBuffGroup(profile.buffGroups, groupId),
    }));
  }

  function updateBuffGroupAction(groupId: string, updater: (g: any) => any): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: updateBuffGroup(profile.buffGroups, groupId, updater),
    }));
  }

  function toggleBuffInGroupAction(groupId: string, buffId: number): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: any) =>
        group.id === groupId
          ? (() => {
              const exists = group.buffIds.includes(buffId);
              return {
                ...group,
                buffIds: exists
                  ? group.buffIds.filter((id) => id !== buffId)
                  : [...group.buffIds, buffId],
                priorityBuffIds: exists
                  ? group.priorityBuffIds.filter((id) => id !== buffId)
                  : group.priorityBuffIds,
              };
            })()
          : group,
      ),
    }));
  }

  function togglePriorityInGroupAction(groupId: string, buffId: number): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: any) =>
        group.id === groupId
          ? (() => {
              const exists = group.priorityBuffIds.includes(buffId);
              return {
                ...group,
                priorityBuffIds: exists
                  ? group.priorityBuffIds.filter((id) => id !== buffId)
                  : uniqueIds([...group.priorityBuffIds, buffId]),
              };
            })()
          : group,
      ),
    }));
  }

  function moveGroupPriorityAction(groupId: string, buffId: number, direction: "up" | "down"): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: any) =>
        group.id === groupId
          ? {
              ...group,
              priorityBuffIds: moveGroupPriority(group, buffId, direction),
            }
          : group,
      ),
    }));
  }

  async function setGroupSearchKeywordAction(groupId: string, value: string): Promise<void> {
    groupSearchKeywords = { ...groupSearchKeywords, [groupId]: value };
    if (value.trim()) {
      const res = await commands.searchBuffsByName(value, 120);
      if (res.status === "ok") {
        groupSearchResults = { ...groupSearchResults, [groupId]: res.data };
      }
    } else {
      groupSearchResults = { ...groupSearchResults, [groupId]: [] };
    }
  }

  async function setGroupPrioritySearchKeywordAction(groupId: string, value: string): Promise<void> {
    groupPrioritySearchKeywords = { ...groupPrioritySearchKeywords, [groupId]: value };
    if (value.trim()) {
      const res = await commands.searchBuffsByName(value, 120);
      if (res.status === "ok") {
        groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: res.data };
      }
    } else {
      groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: [] };
    }
  }

  function getGroupSearchKeywordAction(groupId: string): string {
    return groupSearchKeywords[groupId] ?? "";
  }

  function getGroupPrioritySearchKeywordAction(groupId: string): string {
    return groupPrioritySearchKeywords[groupId] ?? "";
  }

  function getGroupSearchResultsAction(group: any): BuffNameInfo[] {
    const results = groupSearchResults[group.id] ?? [];
    const existingIds = new Set(group.buffIds);
    return results.filter((item) => !existingIds.has(item.baseId));
  }

  function getGroupPrioritySearchResultsAction(group: any): BuffNameInfo[] {
    const results = groupPrioritySearchResults[group.id] ?? [];
    const existingIds = new Set(group.priorityBuffIds);
    if (!group.monitorAll) {
      const inGroup = new Set(group.buffIds);
      return results.filter((item) => inGroup.has(item.baseId) && !existingIds.has(item.baseId));
    }
    return results.filter((item) => !existingIds.has(item.baseId));
  }

  function getGroupPriorityIdsAction(group: any): number[] {
    return uniqueIds(group.priorityBuffIds ?? []);
  }
</script>

{#if buffDisplayMode === "grouped"}
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-foreground">Buff 分组管理</h2>
        <p class="text-xs text-muted-foreground">
          通过分组管理 Buff 展示，组内自动网格对齐
        </p>
      </div>
      <button
        type="button"
        class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
        onclick={addBuffGroupAction}
      >
        新建分组
      </button>
    </div>

    {#if buffGroups.length === 0}
      <div class="text-xs text-muted-foreground">暂无分组，请先新建一个分组</div>
    {/if}

    <div class="space-y-3">
      {#each buffGroups as group (group.id)}
        <div class="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <input
              class="w-52 rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-sm text-foreground"
              value={group.name}
              oninput={(event) =>
                updateBuffGroupAction(group.id, (curr) => ({
                  ...curr,
                  name: (event.currentTarget as HTMLInputElement).value || curr.name,
                }))}
            />
            <button
              type="button"
              class="text-xs px-2 py-1 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
              onclick={() => removeBuffGroupAction(group.id)}
            >
              删除分组
            </button>
            <label class="ml-auto flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={group.monitorAll}
                onchange={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    monitorAll: (event.currentTarget as HTMLInputElement).checked,
                  }))}
              />
              监控全部 Buff
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="text-xs text-muted-foreground">
              图标大小: {group.iconSize}px
              <input
                class="w-full mt-1"
                type="range"
                min="24"
                max="120"
                step="1"
                value={group.iconSize}
                oninput={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    iconSize: Number((event.currentTarget as HTMLInputElement).value),
                  }))}
              />
            </label>
            <label class="text-xs text-muted-foreground">
              列数: {group.columns}
              <input
                class="w-full mt-1"
                type="range"
                min="1"
                max="12"
                step="1"
                value={group.columns}
                oninput={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    columns: Number((event.currentTarget as HTMLInputElement).value),
                  }))}
              />
            </label>
            <label class="text-xs text-muted-foreground">
              行数: {group.rows}
              <input
                class="w-full mt-1"
                type="range"
                min="1"
                max="12"
                step="1"
                value={group.rows}
                oninput={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    rows: Number((event.currentTarget as HTMLInputElement).value),
                  }))}
              />
            </label>
            <label class="text-xs text-muted-foreground">
              间距: {group.gap}px
              <input
                class="w-full mt-1"
                type="range"
                min="0"
                max="16"
                step="1"
                value={group.gap}
                oninput={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    gap: Number((event.currentTarget as HTMLInputElement).value),
                  }))}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-3 text-xs">
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={group.showName}
                onchange={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    showName: (event.currentTarget as HTMLInputElement).checked,
                  }))}
              />
              显示名称
            </label>
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={group.showTime}
                onchange={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    showTime: (event.currentTarget as HTMLInputElement).checked,
                  }))}
              />
              显示时间
            </label>
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={group.showLayer}
                onchange={(event) =>
                  updateBuffGroupAction(group.id, (curr) => ({
                    ...curr,
                    showLayer: (event.currentTarget as HTMLInputElement).checked,
                  }))}
              />
              显示层数
            </label>
          </div>

          {#if !group.monitorAll}
            <div class="space-y-2">
              <input
                class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="搜索并添加到此分组"
                value={getGroupSearchKeywordAction(group.id)}
                oninput={(event) =>
                  setGroupSearchKeywordAction(group.id, (event.currentTarget as HTMLInputElement).value)}
              />
              {#if getGroupSearchResultsAction(group).length > 0}
                <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                  {#each getGroupSearchResultsAction(group).slice(0, 40) as item (item.baseId)}
                    {@const iconBuff = availableBuffMap.get(item.baseId)}
                    <button
                      type="button"
                      class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                      title={item.name}
                      onclick={() => toggleBuffInGroupAction(group.id, item.baseId)}
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
                    onclick={() => toggleBuffInGroupAction(group.id, buffId)}
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
                  value={getGroupPrioritySearchKeywordAction(group.id)}
                  oninput={(event) =>
                    setGroupPrioritySearchKeywordAction(group.id, (event.currentTarget as HTMLInputElement).value)}
                />
                {#if getGroupPrioritySearchResultsAction(group).length > 0}
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                    {#each getGroupPrioritySearchResultsAction(group).slice(0, 40) as item (item.baseId)}
                      {@const iconBuff = availableBuffMap.get(item.baseId)}
                      <button
                        type="button"
                        class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                        title={item.name}
                        onclick={() => togglePriorityInGroupAction(group.id, item.baseId)}
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
                {#each getGroupPriorityIdsAction(group) as buffId, idx (buffId)}
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
                      onclick={() => togglePriorityInGroupAction(group.id, buffId)}
                    >
                      移除
                    </button>
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
                      onclick={() => moveGroupPriorityAction(group.id, buffId, "up")}
                      disabled={idx === 0}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
                      onclick={() => moveGroupPriorityAction(group.id, buffId, "down")}
                      disabled={idx === getGroupPriorityIdsAction(group).length - 1}
                    >
                      下移
                    </button>
                  </div>
                {/each}
                {#if getGroupPriorityIdsAction(group).length === 0}
                  <div class="text-xs text-muted-foreground">未设置优先级，按后端默认顺序显示</div>
                {/if}
              </div>
            </div>
          {:else}
            <div class="space-y-2">
              <div class="text-xs text-muted-foreground">
                当前分组已开启"监控全部 Buff"，可额外配置优先级以便优先展示关键 Buff
              </div>
              <input
                class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="搜索并添加到优先级列表"
                value={getGroupSearchKeywordAction(group.id)}
                oninput={(event) =>
                  setGroupSearchKeywordAction(group.id, (event.currentTarget as HTMLInputElement).value)}
              />
              {#if getGroupSearchResultsAction(group).length > 0}
                <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                  {#each getGroupSearchResultsAction(group).slice(0, 40) as item (item.baseId)}
                    {@const iconBuff = availableBuffMap.get(item.baseId)}
                    <button
                      type="button"
                      class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                      title={item.name}
                      onclick={() => toggleBuffInGroupAction(group.id, item.baseId)}
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
                    onclick={() => toggleBuffInGroupAction(group.id, buffId)}
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
                  value={getGroupPrioritySearchKeywordAction(group.id)}
                  oninput={(event) =>
                    setGroupPrioritySearchKeywordAction(group.id, (event.currentTarget as HTMLInputElement).value)}
                />
                {#if getGroupPrioritySearchResultsAction(group).length > 0}
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                    {#each getGroupPrioritySearchResultsAction(group).slice(0, 40) as item (item.baseId)}
                      {@const iconBuff = availableBuffMap.get(item.baseId)}
                      <button
                        type="button"
                        class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                        title={item.name}
                        onclick={() => togglePriorityInGroupAction(group.id, item.baseId)}
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
                {#each getGroupPriorityIdsAction(group) as buffId, idx (buffId)}
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
                      onclick={() => togglePriorityInGroupAction(group.id, buffId)}
                    >
                      移除
                    </button>
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
                      onclick={() => moveGroupPriorityAction(group.id, buffId, "up")}
                      disabled={idx === 0}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50"
                      onclick={() => moveGroupPriorityAction(group.id, buffId, "down")}
                      disabled={idx === getGroupPriorityIdsAction(group).length - 1}
                    >
                      下移
                    </button>
                  </div>
                {/each}
                {#if getGroupPriorityIdsAction(group).length === 0}
                  <div class="text-xs text-muted-foreground">未设置优先级，按后端默认顺序显示</div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
