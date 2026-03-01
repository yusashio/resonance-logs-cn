<script lang="ts">
  import { createDefaultBuffGroup, type BuffGroup } from "$lib/settings-store";
  import { normalizeGroupPriorityIds } from "$lib/group-utils";

  let {
    group,
    onUpdate,
  }: {
    group: BuffGroup;
    onUpdate?: (groupId: string, updater: (g: BuffGroup) => BuffGroup) => void;
  } = $props();

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

  function removeGroup(): void {
    if (!onUpdate) return;
    onUpdate(group.id, (curr) => curr);
  }
</script>

<div class="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
  <div class="flex flex-wrap items-center gap-2">
    <input
      class="w-52 rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-sm text-foreground"
      value={group.name}
      oninput={(event) =>
        updateGroup((curr) => ({
          ...curr,
          name: (event.currentTarget as HTMLInputElement).value || curr.name,
        }))}
    />
    <button
      type="button"
      class="text-xs px-2 py-1 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
      onclick={removeGroup}
    >
      删除分组
    </button>
    <label class="ml-auto flex items-center gap-2 text-xs text-foreground">
      <input
        type="checkbox"
        checked={group.monitorAll}
        onchange={(event) =>
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
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
          updateGroup((curr) => ({
            ...curr,
            showLayer: (event.currentTarget as HTMLInputElement).checked,
          }))}
      />
      显示层数
    </label>
  </div>
</div>
