<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "$lib/profile-store";
  import { ensureIndividualMonitorAllGroup, ensureBuffGroups, addIndividualMonitorAll, removeIndividualMonitorAll, updateIndividualMonitorAllGroup } from "$lib/buff-group-store";
  import { toggleBuffInGroup, togglePriorityInGroup, moveGroupPriority, setGroupSearchKeyword, setGroupPrioritySearchKeyword, getGroupSearchKeyword, getGroupPrioritySearchKeyword, getGroupSearchResults, getGroupPrioritySearchResults, getGroupPriorityIds, uniqueIds } from "$lib/buff-utils";
  import { commands } from "$lib/bindings";
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const activeProfile = $derived.by(() => getActiveProfile());

  const buffDisplayMode = $derived.by(() => activeProfile.buffDisplayMode ?? "individual");
  const buffGroups = $derived.by(() => ensureBuffGroups(activeProfile));
  const individualMonitorAllGroup = $derived.by(() => ensureIndividualMonitorAllGroup(activeProfile.individualMonitorAllGroup));

  let availableBuffs = $state<BuffDefinition[]>([]);
  let buffNames = $state(new Map<number, BuffNameInfo>());

  $effect(() => {
    void (async () => {
      const res = await commands.getAvailableBuffs();
      if (res.status === "ok") {
        availableBuffs = res.data;
      }
    })();
  });

  $effect(() => {
    const ids = individualMonitorAllGroup?.buffIds ?? [];
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

  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });

  function addIndividualMonitorAllAction(): void {
    updateActiveProfile((profile) => ({
      ...profile,
      individualMonitorAllGroup: addIndividualMonitorAll(profile.individualMonitorAllGroup),
    }));
  }

  function removeIndividualMonitorAllAction(): void {
    updateActiveProfile((profile) => ({
      ...profile,
      individualMonitorAllGroup: removeIndividualMonitorAll(),
    }));
  }

  function updateIndividualMonitorAllGroupAction(updater: (g: any) => any): void {
    updateActiveProfile((profile) => ({
      ...profile,
      individualMonitorAllGroup: updateIndividualMonitorAllGroup(profile.individualMonitorAllGroup, updater),
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

  function setGroupSearchKeywordAction(groupId: string, value: string): void {
    setGroupSearchKeyword(groupId, value);
  }

  function setGroupPrioritySearchKeywordAction(groupId: string, value: string): void {
    setGroupPrioritySearchKeyword(groupId, value);
  }

  function getGroupSearchKeywordAction(groupId: string): string {
    return getGroupSearchKeyword(groupId);
  }

  function getGroupPrioritySearchKeywordAction(groupId: string): string {
    return getGroupPrioritySearchKeyword(groupId);
  }

  function getGroupSearchResultsAction(group: any): any[] {
    return getGroupSearchResults(group, []);
  }

  function getGroupPrioritySearchResultsAction(group: any): any[] {
    return getGroupPrioritySearchResults(group, []);
  }

  function getGroupPriorityIdsAction(group: any): number[] {
    return getGroupPriorityIds(group);
  }
</script>

{#if buffDisplayMode === "individual"}
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-foreground">监控全部 Buff </h2>
        <p class="text-xs text-muted-foreground">
          新增一个网格区域显示全部 Buff（自动排除已在独立模式中选中的 Buff）
        </p>
      </div>
      {#if !individualMonitorAllGroup}
        <button
          type="button"
          class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
          onclick={addIndividualMonitorAllAction}
        >
          监控全部 Buff
        </button>
      {:else}
        <button
          type="button"
          class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
          onclick={removeIndividualMonitorAllAction}
        >
          移除全部 Buff 分组
        </button>
      {/if}
    </div>

    {#if individualMonitorAllGroup}
      <div class="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <input
            class="w-52 rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-sm text-foreground"
            value={individualMonitorAllGroup.name}
            oninput={(event) =>
              updateIndividualMonitorAllGroupAction((curr) => ({
                ...curr,
                name: (event.currentTarget as HTMLInputElement).value || curr.name,
              }))}
          />
          <span class="text-xs text-muted-foreground">固定为监控全部 Buff</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label class="text-xs text-muted-foreground">
            图标大小: {individualMonitorAllGroup.iconSize}px
            <input
              class="w-full mt-1"
              type="range"
              min="24"
              max="120"
              step="1"
              value={individualMonitorAllGroup.iconSize}
              oninput={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  iconSize: Number((event.currentTarget as HTMLInputElement).value),
                }))}
            />
          </label>
          <label class="text-xs text-muted-foreground">
            列数: {individualMonitorAllGroup.columns}
            <input
              class="w-full mt-1"
              type="range"
              min="1"
              max="12"
              step="1"
              value={individualMonitorAllGroup.columns}
              oninput={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  columns: Number((event.currentTarget as HTMLInputElement).value),
                }))}
            />
          </label>
          <label class="text-xs text-muted-foreground">
            行数: {individualMonitorAllGroup.rows}
            <input
              class="w-full mt-1"
              type="range"
              min="1"
              max="12"
              step="1"
              value={individualMonitorAllGroup.rows}
              oninput={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  rows: Number((event.currentTarget as HTMLInputElement).value),
                }))}
            />
          </label>
          <label class="text-xs text-muted-foreground">
            间距: {individualMonitorAllGroup.gap}px
            <input
              class="w-full mt-1"
              type="range"
              min="0"
              max="16"
              step="1"
              value={individualMonitorAllGroup.gap}
              oninput={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
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
              checked={individualMonitorAllGroup.showName}
              onchange={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  showName: (event.currentTarget as HTMLInputElement).checked,
                }))}
            />
            显示名称
          </label>
          <label class="flex items-center gap-1">
            <input
              type="checkbox"
              checked={individualMonitorAllGroup.showTime}
              onchange={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  showTime: (event.currentTarget as HTMLInputElement).checked,
                }))}
            />
            显示时间
          </label>
          <label class="flex items-center gap-1">
            <input
              type="checkbox"
              checked={individualMonitorAllGroup.showLayer}
              onchange={(event) =>
                updateIndividualMonitorAllGroupAction((curr) => ({
                  ...curr,
                  showLayer: (event.currentTarget as HTMLInputElement).checked,
                }))}
            />
            显示层数
          </label>
        </div>
      </div>
    {/if}
  </div>
{/if}
