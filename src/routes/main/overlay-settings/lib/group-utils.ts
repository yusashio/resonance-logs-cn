import type { BuffGroup } from "$lib/settings-store";

export function normalizeGroupPriorityIds(group: BuffGroup): number[] {
  if (group.monitorAll) {
    return uniqueIds(group.priorityBuffIds ?? []);
  }
  const inGroup = new Set(group.buffIds);
  return uniqueIds((group.priorityBuffIds ?? []).filter((id) => inGroup.has(id)));
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

export function ensureBuffGroups(groups: BuffGroup[] = []): BuffGroup[] {
  return groups.map((group, idx) => ensureBuffGroup(group, idx));
}

export function ensureIndividualMonitorAllGroup(
  group: BuffGroup | null | undefined,
): BuffGroup | null {
  if (!group) return null;
  const normalized = ensureBuffGroup(group, 0);
  return {
    ...normalized,
    monitorAll: true,
    name: normalized.name || "全部 Buff",
  };
}

export function uniqueIds(ids: number[]): number[] {
  return Array.from(new Set(ids));
}

export function moveItem(ids: number[], item: number, direction: "up" | "down"): number[] {
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
