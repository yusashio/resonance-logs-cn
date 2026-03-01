<script lang="ts">
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";
  import type { BuffGroup } from "$lib/settings-store";
  import { uniqueIds, moveItem, normalizeGroupPriorityIds } from "$lib/group-utils";

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
    onUpdateProfile,
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

  function toggleBuffInGroup(groupId: string, buffId: number): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: BuffGroup) =>
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

  function togglePriorityInGroup(groupId: string, buffId: number): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: BuffGroup) =>
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

  function moveGroupPriority(groupId: string, buffId: number, direction: "up" | "down"): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: BuffGroup) =>
        group.id === groupId
          ? {
              ...group,
              priorityBuffIds: moveItem(normalizeGroupPriorityIds(group), buffId, direction),
            }
          : group,
      ),
    }));
  }

  function updateBuffGroup(groupId: string, updater: (group: BuffGroup) => BuffGroup): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffGroups: profile.buffGroups.map((group: BuffGroup) =>
        group.id === groupId
          ? (() => {
              const updated = updater(group);
              return {
                ...updated,
                priorityBuffIds: normalizeGroupPriorityIds(updated),
              };
            })()
          : group,
      ),
    }));
  }

  function addBuffGroup(name?: string): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => {
      const groups = profile.buffGroups.map((g: BuffGroup, idx: number) => ({
        ...g,
        id: g.id ?? `group_${idx + 1}`,
        name: g.name ?? `分组 ${idx + 1}`,
      }));
      return {
        ...profile,
        buffGroups: [...groups, { id: `group_${Date.now()}`, name: name ?? `分组 ${groups.length + 1}`, buffIds: [], priorityBuffIds: [], monitorAll: false, position: { x: 40, y: 310 }, iconSize: 44, columns: 6, rows: 3, gap: 6, showName: true, showTime: true, showLayer: true }],
      };
    });
  }

  function removeBuffGroup(groupId: string): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      buffGroups: profile.buffGroups.filter((group: BuffGroup) => group.id !== groupId),
    }));
    const nextKeyword = { ...groupSearchKeyword };
    delete nextKeyword[groupId];
    groupSearchKeyword = nextKeyword;
    const nextResults = { ...groupSearchResults };
    delete nextResults[groupId];
    groupSearchResults = nextResults;
    const nextPriorityKeyword = { ...groupPrioritySearchKeyword };
    delete nextPriorityKeyword[groupId];
    groupPrioritySearchKeyword = nextPriorityKeyword;
    const nextPriorityResults = { ...groupPrioritySearchResults };
    delete nextPriorityResults[groupId];
    groupPrioritySearchResults = nextPriorityResults;
  }

  function addIndividualMonitorAll(): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => {
      const existing = profile.individualMonitorAllGroup;
      if (existing) return profile;
      return {
        ...profile,
        individualMonitorAllGroup: {
          id: `group_${Date.now()}`,
          name: "全部 Buff",
          buffIds: [],
          priorityBuffIds: [],
          monitorAll: true,
          position: { x: 40, y: 310 },
          iconSize: 44,
          columns: 6,
          rows: 3,
          gap: 6,
          showName: true,
          showTime: true,
          showLayer: true,
        },
      };
    });
  }

  function removeIndividualMonitorAll(): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => ({
      ...profile,
      individualMonitorAllGroup: null,
    }));
  }

  function updateIndividualMonitorAllGroup(updater: (group: BuffGroup) => BuffGroup): void {
    if (!onUpdateProfile) return;
    onUpdateProfile((profile: any) => {
      const current = profile.individualMonitorAllGroup;
      if (!current) return profile;
      const updated = {
        ...current,
        name: updater(current).name,
        buffIds: updater(current).buffIds,
        priorityBuffIds: updater(current).priorityBuffIds,
        monitorAll: true,
      };
      return {
        ...profile,
        individualMonitorAllGroup: updated,
      };
    });
  }

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

  function getGroupSearchKeyword(groupId: string): string {
    return groupSearchKeyword[groupId] ?? "";
  }

  function getGroupPrioritySearchKeyword(groupId: string): string {
    return groupPrioritySearchKeyword[groupId] ?? "";
  }

  function getGroupSearchResults(group: BuffGroup): BuffNameInfo[] {
    const results = groupSearchResults[group.id] ?? [];
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPrioritySearchResults(group: BuffGroup): BuffNameInfo[] {
    const results = groupPrioritySearchResults[group.id] ?? [];
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (!group.monitorAll && !group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPriorityIds(group: BuffGroup): number[] {
    return normalizeGroupPriorityIds(group);
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
</script>
