import type { SkillMonitorProfile } from "$lib/settings-store";
import { uniqueIds } from "./group-utils";

export function setOverlaySectionVisibility(
  profile: SkillMonitorProfile,
  key: "showSkillCdGroup" | "showResourceGroup",
  checked: boolean,
): SkillMonitorProfile {
  return {
    ...profile,
    overlayVisibility: {
      showSkillCdGroup: profile.overlayVisibility?.showSkillCdGroup ?? true,
      showResourceGroup: profile.overlayVisibility?.showResourceGroup ?? true,
      [key]: checked,
    },
  };
}

export function toggleOverlaySectionVisibility(
  profile: SkillMonitorProfile,
  key: "showSkillCdGroup" | "showResourceGroup",
): SkillMonitorProfile {
  const current =
    key === "showSkillCdGroup"
      ? profile.overlayVisibility?.showSkillCdGroup ?? true
      : profile.overlayVisibility?.showResourceGroup ?? true;
  return setOverlaySectionVisibility(profile, key, !current);
}

export function setBuffDisplayMode(
  profile: SkillMonitorProfile,
  mode: "individual" | "grouped",
): SkillMonitorProfile {
  return {
    ...profile,
    buffDisplayMode: mode,
    buffPriorityIds: uniqueIds(profile.buffPriorityIds ?? []),
    textBuffMaxVisible: Math.max(1, Math.min(20, profile.textBuffMaxVisible ?? 10)),
    buffGroups: ensureBuffGroups(profile),
  };
}

export function setTextBuffMaxVisible(
  profile: SkillMonitorProfile,
  value: number,
): SkillMonitorProfile {
  const nextValue = Math.max(1, Math.min(20, Math.round(value)));
  return {
    ...profile,
    textBuffMaxVisible: nextValue,
  };
}

export function setSelectedClass(
  profile: SkillMonitorProfile,
  classKey: string,
): SkillMonitorProfile {
  return {
    ...profile,
    selectedClass: classKey,
    monitoredSkillIds: [],
  };
}

export function clearBuffs(
  profile: SkillMonitorProfile,
): SkillMonitorProfile {
  return {
    ...profile,
    monitoredBuffIds: [],
    buffPriorityIds: [],
  };
}

export function toggleBuff(
  profile: SkillMonitorProfile,
  buffId: number,
): SkillMonitorProfile {
  const current = profile.monitoredBuffIds;
  const exists = current.includes(buffId);
  if (exists) {
    return {
      ...profile,
      monitoredBuffIds: current.filter((id) => id !== buffId),
      buffPriorityIds: (profile.buffPriorityIds ?? []).filter((id) => id !== buffId),
    };
  }
  return {
    ...profile,
    monitoredBuffIds: [...current, buffId],
  };
}

export function toggleGlobalPriority(
  profile: SkillMonitorProfile,
  buffId: number,
): SkillMonitorProfile {
  const current = uniqueIds(profile.buffPriorityIds ?? []);
  const exists = current.includes(buffId);
  return {
    ...profile,
    buffPriorityIds: exists ? current.filter((id) => id !== buffId) : [...current, buffId],
  };
}

export function moveGlobalPriority(
  profile: SkillMonitorProfile,
  buffId: number,
  direction: "up" | "down",
): number[] {
  const current = uniqueIds(profile.buffPriorityIds ?? []);
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

function ensureBuffGroups(profile: SkillMonitorProfile) {
  return (profile.buffGroups ?? []).map((group, idx) => ensureBuffGroup(group, idx));
}

function ensureBuffGroup(group: any, index: number) {
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
