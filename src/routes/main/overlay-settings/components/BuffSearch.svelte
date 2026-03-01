<script lang="ts">
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";
  import type { BuffGroup } from "$lib/settings-store";
  import { availableBuffMap, getFilteredBuffs, getGroupPrioritySearchResults, getGroupSearchResults, getSelectedBuffs } from "$lib/buff-utils";

  let {
    availableBuffs = [],
    monitoredBuffIds = [],
    buffPriorityIds = [],
    buffGroups = [],
    individualMonitorAllGroup = null,
    groupSearchKeyword = {},
    groupSearchResults = {},
    groupPrioritySearchKeyword = {},
    groupPrioritySearchResults = {},
  }: {
    availableBuffs?: BuffDefinition[];
    monitoredBuffIds?: number[];
    buffPriorityIds?: number[];
    buffGroups?: BuffGroup[];
    individualMonitorAllGroup?: BuffGroup | null;
    groupSearchKeyword?: Record<string, string>;
    groupSearchResults?: Record<string, BuffNameInfo[]>;
    groupPrioritySearchKeyword?: Record<string, string>;
    groupPrioritySearchResults?: Record<string, BuffNameInfo[]>;
  } = $props();

  const buffNames = $state(new Map<number, BuffNameInfo>());

  const filteredBuffs = $derived.by(() => getFilteredBuffs(buffSearchResults));
  const availableBuffMapComputed = $derived.by(() => availableBuffMap(availableBuffs));
  const selectedBuffs = $derived.by(() => getSelectedBuffs(monitoredBuffIds, availableBuffs));
  const buffPriorityIdsComputed = $derived.by(() => {
    const selected = new Set(monitoredBuffIds);
    return uniqueIds((buffPriorityIds ?? []).filter((id) => selected.has(id)));
  });

  function uniqueIds(ids: number[]): number[] {
    return Array.from(new Set(ids));
  }

  function moveItem(ids: number[], item: number, direction: "up" | "down"): number[] {
    const idx = ids.indexOf(item);
    if (idx === -1) return ids;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return ids;
    const next = [...ids];
    const temp = next[idx];
    const targetValue = next[target];
    if (temp === undefined || targetValue === undefined) return ids;
    next[idx] = targetValue;
    next[target] = temp;
    return next;
  }

  function normalizeGroupPriorityIds(group: BuffGroup): number[] {
    if (group.monitorAll) {
      return uniqueIds(group.priorityBuffIds ?? []);
    }
    const inGroup = new Set(group.buffIds);
    return uniqueIds((group.priorityBuffIds ?? []).filter((id) => inGroup.has(id)));
  }

  function getGroupSearchKeyword(groupId: string): string {
    return groupSearchKeyword[groupId] ?? "";
  }

  function getGroupPrioritySearchKeyword(groupId: string): string {
    return groupPrioritySearchKeyword[groupId] ?? "";
  }

  function getGroupPriorityIds(group: BuffGroup): number[] {
    return normalizeGroupPriorityIds(group);
  }

  function getGroupSearchResultsComputed(group: BuffGroup): BuffNameInfo[] {
    return getGroupSearchResults(group, groupSearchResults[group.id] ?? []);
  }

  function getGroupPrioritySearchResultsComputed(group: BuffGroup): BuffNameInfo[] {
    return getGroupPrioritySearchResults(group, groupPrioritySearchResults[group.id] ?? []);
  }

  function toggleGlobalPriority(buffId: number): void {
    const current = uniqueIds(buffPriorityIds ?? []);
    const exists = current.includes(buffId);
    buffPriorityIds = exists ? current.filter((id) => id !== buffId) : [...current, buffId];
  }

  function togglePriorityInGroup(groupId: string, buffId: number): void {
    const group = buffGroups.find((g) => g.id === groupId);
    if (!group) return;
    
    const exists = group.priorityBuffIds.includes(buffId);
    const updatedPriorityIds = exists
      ? group.priorityBuffIds.filter((id) => id !== buffId)
      : uniqueIds([...group.priorityBuffIds, buffId]);
    
    buffGroups = buffGroups.map((g) =>
      g.id === groupId ? { ...g, priorityBuffIds: updatedPriorityIds } : g,
    );
  }

  function moveGlobalPriority(buffId: number, direction: "up" | "down"): void {
    buffPriorityIds = moveItem(buffPriorityIdsComputed, buffId, direction);
  }

  function moveGroupPriority(groupId: string, buffId: number, direction: "up" | "down"): void {
    const group = buffGroups.find((g) => g.id === groupId);
    if (!group) return;
    
    const current = normalizeGroupPriorityIds(group);
    const next = moveItem(current, buffId, direction);
    
    buffGroups = buffGroups.map((g) =>
      g.id === groupId ? { ...g, priorityBuffIds: next } : g,
    );
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

  function setGroupSearchKeyword(groupId: string, value: string): void {
    groupSearchKeyword = { ...groupSearchKeyword, [groupId]: value };
    const keyword = value.trim();
    if (!keyword) {
      groupSearchResults = { ...groupSearchResults, [groupId]: [] };
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupSearchResults = { ...groupSearchResults, [groupId]: res.data };
    })();
  }

  function setGroupPrioritySearchKeyword(groupId: string, value: string): void {
    groupPrioritySearchKeyword = { ...groupPrioritySearchKeyword, [groupId]: value };
    const keyword = value.trim();
    if (!keyword) {
      groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: [] };
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: res.data };
    })();
  }
</script>
