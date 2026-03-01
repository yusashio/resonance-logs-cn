import { findAnySkillByBaseId, getSkillsByClass, searchResonanceSkills } from "$lib/skill-mappings";
import type { SkillMonitorProfile } from "$lib/settings-store";

export function getFilteredResonanceSkills(keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];
  return searchResonanceSkills(normalized);
}

export function getSelectedResonanceSkills(
  monitoredSkillIds: number[],
): ReturnType<typeof searchResonanceSkills> {
  return monitoredSkillIds
    .map((id) => searchResonanceSkills(id.toString()))
    .flat()
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
    .slice(0, 10);
}

export function toggleSkill(
  monitoredSkillIds: number[],
  skillId: number,
): number[] {
  const exists = monitoredSkillIds.includes(skillId);
  if (exists) {
    return monitoredSkillIds.filter((id) => id !== skillId);
  }
  if (monitoredSkillIds.length >= 10) return monitoredSkillIds;
  return [...monitoredSkillIds, skillId];
}

export function isSelected(skillId: number, monitoredSkillIds: number[]): boolean {
  return monitoredSkillIds.includes(skillId);
}

export function clearSkills(monitoredSkillIds: number[]): number[] {
  return [];
}

export function getSkillsByClassKey(classKey: string) {
  return getSkillsByClass(classKey);
}

export function findSkillById(classKey: string, skillId: number) {
  return findAnySkillByBaseId(classKey, skillId);
}
