import { commands } from "$lib/bindings";
import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";

export interface BuffSearchState {
  buffSearch: string;
  buffSearchResults: BuffNameInfo[];
  globalPrioritySearch: string;
  globalPrioritySearchResults: BuffNameInfo[];
  groupSearchKeyword: Record<string, string>;
  groupSearchResults: Record<string, BuffNameInfo[]>;
  groupPrioritySearchKeyword: Record<string, string>;
  groupPrioritySearchResults: Record<string, BuffNameInfo[]>;
  buffNames: Map<number, BuffNameInfo>;
}

export const buffNames = new Map<number, BuffNameInfo>();

export async function loadAvailableBuffs(): Promise<BuffDefinition[]> {
  const res = await commands.getAvailableBuffs();
  if (res.status === "ok") {
    return res.data;
  }
  return [];
}

export async function loadBuffNames(buffIds: number[]): Promise<Map<number, BuffNameInfo>> {
  const missing = buffIds.filter((id) => !buffNames.has(id));
  if (missing.length === 0) return buffNames;
  
  const res = await commands.getBuffNames(missing);
  if (res.status !== "ok") return buffNames;
  
  const next = new Map(buffNames);
  for (const item of res.data) {
    next.set(item.baseId, item);
  }
  return next;
}

export async function searchBuffsByName(
  keyword: string,
  limit: number = 120,
): Promise<BuffNameInfo[]> {
  if (!keyword.trim()) return [];
  const res = await commands.searchBuffsByName(keyword, limit);
  if (res.status !== "ok") return [];
  return res.data;
}

export function getAvailableBuffMap(buffs: BuffDefinition[]): Map<number, BuffDefinition> {
  const map = new Map<number, BuffDefinition>();
  for (const buff of buffs) {
    map.set(buff.baseId, buff);
  }
  return map;
}

export function getSelectedBuffs(
  monitoredBuffIds: number[],
  availableBuffs: BuffDefinition[],
): BuffDefinition[] {
  return monitoredBuffIds
    .map((id) => availableBuffs.find((buff) => buff.baseId === id))
    .filter(Boolean) as BuffDefinition[];
}

export function getFilteredBuffs(buffSearchResults: BuffNameInfo[]): BuffNameInfo[] {
  const ids = new Set<number>();
  const merged: BuffNameInfo[] = [];
  for (const item of buffSearchResults) {
    if (ids.has(item.baseId)) continue;
    ids.add(item.baseId);
    merged.push(item);
  }
  return merged;
}

export function getGroupSearchResults(
  group: { id: string; buffIds: number[]; priorityBuffIds: number[] },
  results: BuffNameInfo[],
): BuffNameInfo[] {
  const groupResults = results ?? [];
  const ids = new Set<number>();
  return groupResults.filter((item) => {
    if (ids.has(item.baseId)) return false;
    if (group.buffIds.includes(item.baseId)) return false;
    if (group.priorityBuffIds.includes(item.baseId)) return false;
    ids.add(item.baseId);
    return true;
  });
}

export function getGroupPrioritySearchResults(
  group: { id: string; buffIds: number[]; priorityBuffIds: number[]; monitorAll: boolean },
  results: BuffNameInfo[],
): BuffNameInfo[] {
  const groupResults = results ?? [];
  const ids = new Set<number>();
  return groupResults.filter((item) => {
    if (ids.has(item.baseId)) return false;
    if (!group.monitorAll && !group.buffIds.includes(item.baseId)) return false;
    if (group.priorityBuffIds.includes(item.baseId)) return false;
    ids.add(item.baseId);
    return true;
  });
}

export function toggleBuffInGroup(
  group: { buffIds: number[]; priorityBuffIds: number[] },
  buffId: number,
): { buffIds: number[]; priorityBuffIds: number[] } {
  const exists = group.buffIds.includes(buffId);
  return {
    buffIds: exists
      ? group.buffIds.filter((id) => id !== buffId)
      : [...group.buffIds, buffId],
    priorityBuffIds: exists
      ? group.priorityBuffIds.filter((id) => id !== buffId)
      : group.priorityBuffIds,
  };
}

export function togglePriorityInGroup(
  group: { priorityBuffIds: number[] },
  buffId: number,
): number[] {
  const exists = group.priorityBuffIds.includes(buffId);
  return exists
    ? group.priorityBuffIds.filter((id) => id !== buffId)
    : uniqueIds([...group.priorityBuffIds, buffId]);
}

export function moveGroupPriority(
  group: { priorityBuffIds: number[] },
  buffId: number,
  direction: "up" | "down",
): number[] {
  const current = uniqueIds(group.priorityBuffIds);
  const idx = current.indexOf(buffId);
  if (idx === -1) return current;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= current.length) return current;
  const next = [...current];
  const temp = next[idx];
  const targetValue = next[target];
  if (temp === undefined || targetValue === undefined) return current;
  next[idx] = targetValue;
  next[target] = temp;
  return next;
}

export function setGroupSearchKeyword(groupId: string, value: string): void {
  groupSearchKeyword[groupId] = value;
}

export function setGroupPrioritySearchKeyword(groupId: string, value: string): void {
  groupPrioritySearchKeyword[groupId] = value;
}

export function getGroupSearchKeyword(groupId: string): string {
  return groupSearchKeyword[groupId] ?? "";
}

export function getGroupPrioritySearchKeyword(groupId: string): string {
  return groupPrioritySearchKeyword[groupId] ?? "";
}

export function getGroupSearchResultsAction(group: any, results: BuffNameInfo[]): BuffNameInfo[] {
  return getGroupSearchResults(group, results);
}

export function getGroupPrioritySearchResultsAction(group: any, results: BuffNameInfo[]): BuffNameInfo[] {
  return getGroupPrioritySearchResults(group, results);
}

export function getGroupPriorityIds(group: any): number[] {
  return uniqueIds(group.priorityBuffIds ?? []);
}

export const groupSearchKeyword: Record<string, string> = {};

export const groupPrioritySearchKeyword: Record<string, string> = {};

export function uniqueIds(ids: number[]): number[] {
  return Array.from(new Set(ids));
}
