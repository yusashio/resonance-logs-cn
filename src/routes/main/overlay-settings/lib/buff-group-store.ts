import { createDefaultBuffGroup, type BuffGroup } from "$lib/settings-store";
import { normalizeGroupPriorityIds } from "./group-utils";

export function updateBuffGroup(
  buffGroups: BuffGroup[],
  groupId: string,
  updater: (group: BuffGroup) => BuffGroup,
): BuffGroup[] {
  return buffGroups.map((group) =>
    group.id === groupId
      ? (() => {
          const updated = updater(group);
          return {
            ...updated,
            priorityBuffIds: normalizeGroupPriorityIds(updated),
          };
        })()
      : group,
  );
}

export function addBuffGroup(
  buffGroups: BuffGroup[],
  name?: string,
): BuffGroup[] {
  const groups = ensureBuffGroups(buffGroups);
  return [
    ...groups,
    createDefaultBuffGroup(name ?? `分组 ${groups.length + 1}`, groups.length + 1),
  ];
}

export function removeBuffGroup(
  buffGroups: BuffGroup[],
  groupId: string,
): BuffGroup[] {
  return ensureBuffGroups(buffGroups).filter((group) => group.id !== groupId);
}

export function ensureBuffGroups(groups: BuffGroup[] = []): BuffGroup[] {
  return groups.map((group, idx) => ensureBuffGroup(group, idx));
}

export function ensureBuffGroup(group: BuffGroup, index: number): BuffGroup {
  return {
    id: group.id ?? `group_${index + 1}`,
    name: group.name ?? `分组 ${index + 1}`,
    buffIds: group.buffIds ?? [],
    priorityBuffIds: group.priorityBuffIds ?? [],
    monitorAll: group.monitorAll ?? false,
    position: group.position ?? { x: 40 + index * 40, y: 310 + index * 40 },
    iconSize: Math.max(24, Math.min(120, group.iconSize ?? 44)),
    columns: Math.max(1, Math.min(12, group.columns ?? 6)),
    rows: Math.max(1, Math.min(12, group.rows ?? 3)),
    gap: Math.max(0, Math.min(16, group.gap ?? 6)),
    showName: group.showName ?? true,
    showTime: group.showTime ?? true,
    showLayer: group.showLayer ?? true,
  };
}

export function addIndividualMonitorAll(
  current: BuffGroup | null | undefined,
): BuffGroup | null {
  if (current) return current;
  return {
    ...createDefaultBuffGroup("全部 Buff", 1),
    monitorAll: true,
  };
}

export function removeIndividualMonitorAll(): null {
  return null;
}

export function updateIndividualMonitorAllGroup(
  current: BuffGroup | null | undefined,
  updater: (group: BuffGroup) => BuffGroup,
): BuffGroup | null {
  if (!current) return null;
  const updated = ensureBuffGroup(updater(current), 0);
  return {
    ...updated,
    monitorAll: true,
  };
}
