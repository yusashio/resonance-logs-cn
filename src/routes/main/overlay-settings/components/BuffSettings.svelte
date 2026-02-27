<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "../lib/profile-store";
  import { clearBuffs, toggleBuff, toggleGlobalPriority, moveGlobalPriority, setTextBuffMaxVisible, setBuffDisplayMode } from "../lib/profile-updater";
  import { uniqueIds } from "../lib/group-utils";
  import { commands } from "$lib/bindings";
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";
  import SettingsSwitch from "../../dps/settings/settings-switch.svelte";
  import { SETTINGS } from "$lib/settings-store";

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

  function setBuffDisplayModeAction(mode: "individual" | "grouped"): void {
    updateActiveProfile((profile) => setBuffDisplayMode(profile, mode));
  }

  function isBuffSelected(buffId: number): boolean {
    return monitoredBuffIds.includes(buffId);
  }

  const selectedBuffs = $derived.by(
    () =>
      monitoredBuffIds
        .map((id) => availableBuffs.find((buff) => buff.baseId === id))
        .filter(Boolean) as BuffDefinition[],
  );

  const showAllBuffs = $derived(SETTINGS.skillMonitor?.state?.enableBuff ?? false);
  const buffSelectionDisabled = $derived(showAllBuffs);
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div>
      <h2 class="text-base font-semibold text-foreground">显示模式</h2>
      <p class="text-xs text-muted-foreground">
        选择 Buff 显示方式
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="px-4 py-2 rounded border border-border/60 text-sm {buffDisplayMode === 'individual'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/30 text-foreground hover:bg-muted/40'}"
        onclick={() => setBuffDisplayModeAction('individual')}
      >
        独立模式
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded border border-border/60 text-sm {buffDisplayMode === 'grouped'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/30 text-foreground hover:bg-muted/40'}"
        onclick={() => setBuffDisplayModeAction('grouped')}
      >
        分组模式
      </button>
    </div>
  </div>

  {#if buffDisplayMode === "individual"}
    <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-foreground">Buff 监控</h2>
          <p class="text-xs text-muted-foreground">
            仅可选择有图标的 Buff，支持搜索名称
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-xs text-muted-foreground">
            已选 {monitoredBuffIds.length}
          </div>
          <button
            type="button"
            class="text-xs px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={clearBuffsAction}
            disabled={buffSelectionDisabled}
          >
            清空
          </button>
        </div>
      </div>

      <SettingsSwitch
        bind:checked={SETTINGS.skillMonitor.state.enableBuff}
        label="显示全部 Buff"
        description="启用后将显示所有当前生效的 Buff"
      />

      <div class="flex flex-wrap gap-3 items-center" class:disabled={buffSelectionDisabled}>
        <input
          class="w-full sm:w-64 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          placeholder="搜索 Buff 名称"
          bind:value={buffSearch}
          disabled={buffSelectionDisabled}
        />
      </div>

      {#if buffSearch.trim().length > 0 && filteredBuffs.length > 0}
        <div class="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3" class:disabled={buffSelectionDisabled}>
          {#each filteredBuffs.slice(0, 40) as item (item.baseId)}
            {@const iconBuff = availableBuffMap.get(item.baseId)}
            <button
              type="button"
              class="relative group rounded-lg border overflow-hidden transition-colors {isBuffSelected(item.baseId)
                ? 'border-primary ring-1 ring-primary'
                : 'border-border/60 hover:border-border'}"
              title={item.name}
              onclick={() => toggleBuffAction(item.baseId)}
            >
              {#if iconBuff}
                <img
                  src={iconBuff.talentSpriteFile
                    ? `/images/talent/${iconBuff.talentSpriteFile}`
                    : `/images/buff/${iconBuff.spriteFile}`}
                  alt={iconBuff.name}
                  class="w-full h-full object-contain aspect-square bg-muted/20"
                />
                <div class="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] text-white px-1 py-0.5 truncate">
                  {iconBuff.talentName || iconBuff.name.slice(0, 6)}
                </div>
              {:else}
                <div class="w-full h-full aspect-square flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                  无图标
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-xs text-muted-foreground" class:disabled={buffSelectionDisabled}>
          请输入关键词搜索 Buff
        </div>
      {/if}

      <div class="space-y-2" class:disabled={buffSelectionDisabled}>
        <div class="text-xs text-muted-foreground">已选 Buff</div>
        <div class="flex flex-wrap gap-2">
          {#each selectedBuffs as buff (buff.baseId)}
            <button
              type="button"
              class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
              title={buff.talentName ? `${buff.talentName} - ${buff.name}` : buff.name}
              onclick={() => toggleBuffAction(buff.baseId)}
            >
              <img
                src={buff.talentSpriteFile
                  ? `/images/talent/${buff.talentSpriteFile}`
                  : `/images/buff/${buff.spriteFile}`}
                alt={buff.name}
                class="w-full h-full object-contain"
              />
              <div class="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate">
                {buff.talentName || buff.name.slice(0, 6)}
              </div>
            </button>
          {/each}
          {#if selectedBuffs.length === 0}
            <div class="text-xs text-muted-foreground">未选择 Buff</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div>
      <h2 class="text-base font-semibold text-foreground">文本 Buff 设置</h2>
      <p class="text-xs text-muted-foreground">
        配置文本形式显示的 Buff
      </p>
    </div>
    <SettingsSwitch
      bind:checked={SETTINGS.skillMonitor.state.enableTextBuff}
      label="启用文本 Buff 显示"
      description="启用后将显示无图标的 Buff"
    />
    <label class="text-xs text-muted-foreground">
      最大显示数量: {textBuffMaxVisible}
      <input
        class="w-full mt-1"
        type="range"
        min="1"
        max="20"
        step="1"
        value={textBuffMaxVisible}
        oninput={(event) =>
          setTextBuffMaxVisibleAction(Number((event.currentTarget as HTMLInputElement).value))}
      />
    </label>
  </div>
</div>

<style>
  .disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
