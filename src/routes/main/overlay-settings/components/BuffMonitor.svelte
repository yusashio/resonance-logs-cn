<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "$lib/profile-store";
  import { clearBuffs, toggleBuff, toggleGlobalPriority, moveGlobalPriority, setTextBuffMaxVisible } from "$lib/profile-updater";
  import { uniqueIds } from "$lib/group-utils";
  import { commands } from "$lib/bindings";
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const activeProfile = $derived.by(() => getActiveProfile());

  const monitoredBuffIds = $derived.by(() => activeProfile.monitoredBuffIds);
  const buffPriorityIds = $derived.by(() => activeProfile.buffPriorityIds);
  const buffDisplayMode = $derived.by(() => activeProfile.buffDisplayMode ?? "individual");
  const textBuffMaxVisible = $derived.by(() => Math.max(1, Math.min(20, activeProfile.textBuffMaxVisible ?? 10)));

  let availableBuffs = $state<BuffDefinition[]>([]);
  let buffNames = $state(new Map<number, BuffNameInfo>());
  let buffSearch = $state("");
  let buffSearchResults = $state<BuffNameInfo[]>([]);
  let globalPrioritySearch = $state("");
  let globalPrioritySearchResults = $state<BuffNameInfo[]>([]);

  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });

  const selectedBuffs = $derived.by(() =>
    monitoredBuffIds
      .map((id) => availableBuffs.find((buff) => buff.baseId === id))
      .filter(Boolean) as BuffDefinition[],
  );

  const filteredBuffs = $derived.by(() => {
    const ids = new Set<number>();
    const merged: BuffNameInfo[] = [];
    for (const item of buffSearchResults) {
      if (ids.has(item.baseId)) continue;
      ids.add(item.baseId);
      merged.push(item);
    }
    return merged;
  });

  const buffPriorityIdsComputed = $derived.by(() => {
    const selected = new Set(monitoredBuffIds);
    return uniqueIds((buffPriorityIds ?? []).filter((id) => selected.has(id)));
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
    const keyword = buffSearch.trim();
    if (!keyword) {
      buffSearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      buffSearchResults = res.data;
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

  function toggleBuffAction(buffId: number): void {
    updateActiveProfile((profile) => toggleBuff(profile, buffId));
  }

  function toggleGlobalPriorityAction(buffId: number): void {
    updateActiveProfile((profile) => toggleGlobalPriority(profile, buffId));
  }

  function moveGlobalPriorityAction(buffId: number, direction: "up" | "down"): void {
    updateActiveProfile((profile) => ({
      ...profile,
      buffPriorityIds: moveGlobalPriority(profile, buffId, direction),
    }));
  }

  function setTextBuffMaxVisibleAction(value: number): void {
    updateActiveProfile((profile) => setTextBuffMaxVisible(profile, value));
  }

  function clearBuffsAction(): void {
    updateActiveProfile((profile) => clearBuffs(profile));
  }

  function isBuffSelected(buffId: number): boolean {
    return monitoredBuffIds.includes(buffId);
  }
</script>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
  <div>
    <h2 class="text-base font-semibold text-foreground">监控 Buff</h2>
    <p class="text-xs text-muted-foreground">
      选择要监控的 Buff（按方案保存）
    </p>
  </div>

  <div class="space-y-2">
    <input
      class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      placeholder="搜索并添加 Buff"
      bind:value={buffSearch}
    />
    {#if buffSearch.trim().length > 0 && filteredBuffs.length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
        {#each filteredBuffs.slice(0, 40) as item (item.baseId)}
          {@const iconBuff = availableBuffMap.get(item.baseId)}
          <button
            type="button"
            class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
            title={item.name}
            onclick={() => toggleBuffAction(item.baseId)}
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
      已选择 Buff（点击可取消选择）
    </div>
    <div class="flex flex-wrap gap-2">
      {#each monitoredBuffIds as buffId (buffId)}
        {@const iconBuff = availableBuffMap.get(buffId)}
        {@const nameInfo = buffNames.get(buffId)}
        <button
          type="button"
          class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
          title={nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
          onclick={() => toggleBuffAction(buffId)}
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
      {#if monitoredBuffIds.length === 0}
        <div class="text-xs text-muted-foreground">未选择 Buff</div>
      {/if}
    </div>
    <button
      type="button"
      class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
      onclick={clearBuffsAction}
    >
      清空 Buff
    </button>
  </div>
</div>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
  <div>
    <h2 class="text-base font-semibold text-foreground">监控预览</h2>
    <p class="text-xs text-muted-foreground">按选择顺序排列</p>
  </div>
  <div class="grid grid-cols-5 gap-2">
    {#each monitoredBuffIds.slice(0, 10) as buffId, idx (idx)}
      {@const iconBuff = availableBuffMap.get(buffId)}
      {@const nameInfo = buffNames.get(buffId)}
      <button
        type="button"
        class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 aspect-square text-left hover:border-border hover:bg-muted/30"
        title={nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
        onclick={() => toggleBuffAction(buffId)}
      >
        {#if iconBuff}
          <img
            src={`/images/buff/${iconBuff.spriteFile}`}
            alt={iconBuff.name}
            class="w-full h-full object-cover"
          />
        {:else if buffId}
          <div class="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
            #{buffId}
          </div>
        {:else}
          <div class="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
            空
          </div>
        {/if}
      </button>
    {/each}
    {#if monitoredBuffIds.length === 0}
      <div class="col-span-5 text-center text-xs text-muted-foreground py-2">
        未选择 Buff
      </div>
    {/if}
  </div>
</div>
