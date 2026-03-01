import { SETTINGS } from "$lib/settings-store";
import type { SkillMonitorProfile } from "$lib/settings-store";

export function getActiveProfile(): SkillMonitorProfile {
  const state = SETTINGS.skillMonitor.state;
  const profiles = state.profiles;
  const activeIndex = Math.min(
    Math.max(state.activeProfileIndex, 0),
    Math.max(0, profiles.length - 1),
  );
  return profiles[activeIndex] ?? createDefaultProfile();
}

export function createDefaultProfile(name = "默认方案", classKey = "wind_knight"): SkillMonitorProfile {
  return {
    name,
    selectedClass: classKey,
    monitoredSkillIds: [],
    monitoredBuffIds: [],
    buffPriorityIds: [],
    buffDisplayMode: "individual",
    buffGroups: [],
    individualMonitorAllGroup: null,
    textBuffMaxVisible: 10,
    overlayPositions: {
      skillCdGroup: { x: 40, y: 40 },
      resourceGroup: { x: 40, y: 170 },
      textBuffPanel: { x: 360, y: 40 },
      specialBuffGroup: { x: 360, y: 220 },
      iconBuffPositions: {},
    },
    overlaySizes: {
      skillCdGroupScale: 1,
      resourceGroupScale: 1,
      textBuffPanelScale: 1,
      iconBuffSizes: {},
    },
    overlayVisibility: {
      showSkillCdGroup: true,
      showResourceGroup: true,
    },
  };
}

export function updateActiveProfile(
  updater: (profile: SkillMonitorProfile) => SkillMonitorProfile,
): void {
  const state = SETTINGS.skillMonitor.state;
  const profiles = state.profiles;
  if (profiles.length === 0) {
    state.profiles = [createDefaultProfile()];
    state.activeProfileIndex = 0;
    return;
  }
  const index = Math.min(
    Math.max(state.activeProfileIndex, 0),
    profiles.length - 1,
  );
  state.profiles = profiles.map((profile, i) =>
    i === index ? updater(profile) : profile,
  );
}

export function setActiveProfileIndex(index: number): void {
  const state = SETTINGS.skillMonitor.state;
  const maxIndex = Math.max(0, state.profiles.length - 1);
  state.activeProfileIndex = Math.min(Math.max(index, 0), maxIndex);
}

export function addProfile(name?: string): void {
  const state = SETTINGS.skillMonitor.state;
  const nextIndex = state.profiles.length + 1;
  const nextProfile = createDefaultProfile(name ?? `方案 ${nextIndex}`);
  state.profiles = [...state.profiles, nextProfile];
  state.activeProfileIndex = state.profiles.length - 1;
}

export function renameActiveProfile(): void {
  const profile = getActiveProfile();
  const nextName = window.prompt("请输入新的方案名称", profile.name);
  if (!nextName) return;
  const trimmedName = nextName.trim();
  if (!trimmedName) return;
  updateActiveProfile((p) => ({ ...p, name: trimmedName }));
}

export function removeActiveProfile(): void {
  const state = SETTINGS.skillMonitor.state;
  if (state.profiles.length <= 1) return;
  const index = Math.min(
    Math.max(state.activeProfileIndex, 0),
    state.profiles.length - 1,
  );
  state.profiles = state.profiles.filter((_, i) => i !== index);
  state.activeProfileIndex = Math.min(index, state.profiles.length - 1);
}
