/**
 * @file 状态管理模块 - 负责游戏Overlay的状态管理
 * @description 包含状态初始化、数据更新、派生状态计算等逻辑
 */

import { onBuffUpdate, onFightResUpdate, onSkillCdUpdate, type BuffUpdateState, type SkillCdState } from "$lib/api";
import { commands, type BuffDefinition } from "$lib/bindings";
import { SETTINGS, type BuffGroup, type OverlayPositions, type OverlaySizes, type OverlayVisibility, type SkillMonitorProfile } from "$lib/settings-store";
import { findAnySkillByBaseId, findResourcesByClass, type SpecialBuffDisplay, findSkillDerivationBySource, findSpecialBuffDisplays } from "$lib/skill-mappings";

import type { IconBuffDisplay, TextBuffDisplay, SkillDisplay } from "./transformers";

/**
 * 游戏Overlay状态接口
 */
export interface OverlayState {
  cdMap: Map<number, SkillCdState>;
  displayMap: Map<number, SkillDisplay>;
  fightResValues: number[];
  buffMap: Map<number, BuffUpdateState>;
  activeBuffIds: Set<number>;
  buffDurationPercents: Map<number, number>;
  buffDefinitions: Map<number, BuffDefinition>;
  buffNameMap: Map<number, string>;
  iconDisplayBuffs: IconBuffDisplay[];
  textBuffs: TextBuffDisplay[];
  rafId: number | null;
}

/**
 * 派生状态接口
 */
export interface DerivedState {
  activeProfileIndex: number;
  activeProfile: SkillMonitorProfile | null;
  selectedClassKey: string;
  monitoredSkillIds: number[];
  monitoredBuffIds: number[];
  buffDisplayMode: "individual" | "grouped";
  textBuffMaxVisible: number;
  normalizedBuffGroups: BuffGroup[];
  individualMonitorAllGroup: BuffGroup | null;
  overlayVisibility: OverlayVisibility;
  specialBuffConfigMap: Map<number, SpecialBuffDisplay>;
  groupedIconBuffs: Map<string, IconBuffDisplay[]>;
  individualModeIconBuffs: IconBuffDisplay[];
  individualAllGroupBuffs: IconBuffDisplay[];
  specialStandaloneBuffs: IconBuffDisplay[];
  limitedTextBuffs: TextBuffDisplay[];
}

/**
 * 初始化默认状态
 * @returns 初始状态对象
 */
export function createInitialState(): OverlayState {
  return {
    cdMap: new Map<number, SkillCdState>(),
    displayMap: new Map<number, SkillDisplay>(),
    fightResValues: [],
    buffMap: new Map<number, BuffUpdateState>(),
    activeBuffIds: new Set<number>(),
    buffDurationPercents: new Map<number, number>(),
    buffDefinitions: new Map<number, BuffDefinition>(),
    buffNameMap: new Map<number, string>(),
    iconDisplayBuffs: [],
    textBuffs: [],
    rafId: null,
  };
}

/**
 * 计算派生状态
 * @param state 当前状态
 * @param activeProfile 当前激活的配置文件
 * @returns 派生状态对象
 */
export function computeDerivedState(
  activeProfile: SkillMonitorProfile | null,
): DerivedState {
  const selectedClassKey = activeProfile?.selectedClass ?? "wind_knight";
  const monitoredSkillIds = activeProfile?.monitoredSkillIds ?? [];
  const monitoredBuffIds = activeProfile?.monitoredBuffIds ?? [];
  const buffDisplayMode = activeProfile?.buffDisplayMode ?? "individual";
  const textBuffMaxVisible = Math.max(1, Math.min(20, activeProfile?.textBuffMaxVisible ?? 10));

  const normalizedBuffGroups = activeProfile
    ? ensureBuffGroups(activeProfile)
    : [];

  const individualMonitorAllGroup = activeProfile
    ? ensureIndividualMonitorAllGroup(activeProfile)
    : null;

  const overlayVisibility = activeProfile?.overlayVisibility ?? {
    showSkillCdGroup: true,
    showResourceGroup: true,
  };

  const specialBuffConfigMap = new Map<number, SpecialBuffDisplay>();
  if (activeProfile) {
    for (const config of findSpecialBuffDisplays(selectedClassKey)) {
      specialBuffConfigMap.set(config.buffBaseId, config);
    }
  }

  return {
    activeProfileIndex: activeProfile ? 0 : 0,
    activeProfile,
    selectedClassKey,
    monitoredSkillIds,
    monitoredBuffIds,
    buffDisplayMode,
    textBuffMaxVisible,
    normalizedBuffGroups,
    individualMonitorAllGroup,
    overlayVisibility,
    specialBuffConfigMap,
    groupedIconBuffs: new Map<string, IconBuffDisplay[]>(),
    individualModeIconBuffs: [],
    individualAllGroupBuffs: [],
    specialStandaloneBuffs: [],
    limitedTextBuffs: [],
  };
}

/**
 * 确保Overlay位置存在默认值
 * @param profile 配置文件
 * @returns 位置信息对象
 */
export function ensureOverlayPositions(profile: SkillMonitorProfile): OverlayPositions {
  const current = profile.overlayPositions;
  return {
    skillCdGroup: current?.skillCdGroup ?? { x: 40, y: 40 },
    resourceGroup: current?.resourceGroup ?? { x: 40, y: 170 },
    textBuffPanel: current?.textBuffPanel ?? { x: 360, y: 40 },
    specialBuffGroup: current?.specialBuffGroup ?? { x: 360, y: 220 },
    attrPanel: current?.attrPanel ?? { x: 40, y: 310 },
    iconBuffPositions: current?.iconBuffPositions ?? {},
  };
}

/**
 * 确保Overlay尺寸存在默认值
 * @param profile 配置文件
 * @returns 尺寸信息对象
 */
export function ensureOverlaySizes(profile: SkillMonitorProfile): OverlaySizes {
  const current = profile.overlaySizes;
  return {
    skillCdGroupScale: current?.skillCdGroupScale ?? 1,
    resourceGroupScale: current?.resourceGroupScale ?? 1,
    textBuffPanelScale: current?.textBuffPanelScale ?? 1,
    attrPanelScale: current?.attrPanelScale ?? 1,
    iconBuffSizes: current?.iconBuffSizes ?? {},
  };
}

/**
 * 确保Overlay可见性存在默认值
 * @param profile 配置文件
 * @returns 可见性信息对象
 */
export function ensureOverlayVisibility(profile: SkillMonitorProfile): OverlayVisibility {
  const current = profile.overlayVisibility;
  return {
    showSkillCdGroup: current?.showSkillCdGroup ?? true,
    showResourceGroup: current?.showResourceGroup ?? true,
    showAttrPanel: current?.showAttrPanel ?? true,
  };
}

/**
 * 确保Buff分组存在默认值
 * @param profile 配置文件
 * @returns Buff分组数组
 */
export function ensureBuffGroups(profile: SkillMonitorProfile): BuffGroup[] {
  const groups = profile.buffGroups ?? [];
  return groups.map((group, index) => ({
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
  }));
}

/**
 * 确保单个监控全部Buff分组存在默认值
 * @param profile 配置文件
 * @returns 单个监控全部Buff分组，如果不存在则返回 null
 */
export function ensureIndividualMonitorAllGroup(profile: SkillMonitorProfile): BuffGroup | null {
  const group = profile.individualMonitorAllGroup;
  if (!group) return null;
  const fallbackPosition = { x: 40, y: 310 };
  return {
    id: group.id ?? "individual_all_group",
    name: group.name ?? "全部 Buff",
    buffIds: [],
    priorityBuffIds: group.priorityBuffIds ?? [],
    monitorAll: true,
    position: group.position ?? fallbackPosition,
    iconSize: Math.max(24, Math.min(120, group.iconSize ?? 44)),
    columns: Math.max(1, Math.min(12, group.columns ?? 6)),
    rows: Math.max(1, Math.min(12, group.rows ?? 3)),
    gap: Math.max(0, Math.min(16, group.gap ?? 6)),
    showName: group.showName ?? true,
    showTime: group.showTime ?? true,
    showLayer: group.showLayer ?? true,
  };
}

/**
 * 更新激活的配置文件
 * @param updater 更新函数
 */
export function updateActiveProfile(
  updater: (profile: SkillMonitorProfile) => SkillMonitorProfile,
): void {
  const state = SETTINGS.skillMonitor.state;
  const profiles = state.profiles;
  if (profiles.length === 0) return;
  const index = Math.min(Math.max(state.activeProfileIndex, 0), profiles.length - 1);
  state.profiles = profiles.map((profile, i) => (i === index ? updater(profile) : profile));
}

/**
 * 加载Buff名称
 * @param baseIds Buff ID列表
 * @param buffNameMap 当前Buff名称Map
 * @returns 加载后的Buff名称Map
 */
export async function loadBuffNames(
  baseIds: number[],
  buffNameMap: Map<number, string>,
): Promise<Map<number, string>> {
  if (baseIds.length === 0) return buffNameMap;
  const uniq = Array.from(new Set(baseIds)).filter((id) => !buffNameMap.has(id));
  if (uniq.length === 0) return buffNameMap;
  const res = await commands.getBuffNames(uniq);
  if (res.status !== "ok") return buffNameMap;
  const next = new Map(buffNameMap);
  for (const item of res.data) {
    next.set(item.baseId, item.name);
  }
  return next;
}

/**
 * 计算技能CD显示数据
 * @param skillId 技能ID
 * @param cd 技能CD状态
 * @param now 当前时间戳
 * @param selectedClassKey 选中的职业键值
 * @returns 技能显示数据
 */
export function computeSkillDisplay(
  skillId: number,
  cd: SkillCdState,
  now: number,
  selectedClassKey: string,
): SkillDisplay | null {
  const skill = findAnySkillByBaseId(selectedClassKey, skillId);
  const cdAccelerateRate = Math.max(0, cd.cdAccelerateRate ?? 0);
  const elapsed = Math.max(0, now - cd.receivedAt);
  const baseDuration = cd.duration > 0 ? Math.max(1, cd.duration) : 1;
  const reducedDuration = cd.duration > 0 ? Math.max(0, cd.calculatedDuration) : 0;
  const validCdScale = cd.duration > 0 ? reducedDuration / baseDuration : 1;
  const scaledValidCdTime = cd.validCdTime * validCdScale;
  const progressed = scaledValidCdTime + elapsed * (1 + cdAccelerateRate);

  if (cd.duration === -1 && cd.skillCdType === 1) {
    if (!skill?.maxValidCdTime) return null;
    const chargePercent = Math.max(0, Math.min(1, cd.validCdTime / skill.maxValidCdTime));
    return {
      isActive: chargePercent < 1,
      percent: 1 - chargePercent,
      text: `${Math.round(chargePercent * 100)}%`,
    };
  }

  if (cd.skillCdType === 1 && cd.duration > 0) {
    const maxCharges = Math.max(1, skill?.maxCharges ?? 1);
    if (maxCharges > 1) {
      const chargeDuration = Math.max(1, cd.calculatedDuration);
      const maxVct = maxCharges * chargeDuration;
      const currentVct = Math.min(maxVct, progressed);
      const chargesAvailable = Math.min(maxCharges, Math.floor(currentVct / chargeDuration));
      const chargesOnCd = Math.max(0, maxCharges - chargesAvailable);
      if (chargesOnCd <= 0) {
        return {
          isActive: false,
          percent: 0,
          text: "",
          chargesText: `${maxCharges}/${maxCharges}`,
        };
      }
      const timeToNextCharge = Math.max(0, chargeDuration - (currentVct % chargeDuration));
      return {
        isActive: chargesOnCd > 0,
        percent: Math.min(1, timeToNextCharge / chargeDuration),
        text: (timeToNextCharge / 1000).toFixed(1),
        chargesText: `${chargesAvailable}/${maxCharges}`,
      };
    }
  }

  const remaining = reducedDuration > 0 ? Math.max(0, reducedDuration - progressed) : 0;
  const duration = reducedDuration > 0 ? reducedDuration : 1;
  return {
    isActive: remaining > 0,
    percent: remaining > 0 ? Math.min(1, remaining / duration) : 0,
    text: remaining > 0 ? (remaining / 1000).toFixed(1) : "",
  };
}

/**
 * 计算资源值
 * @param rawValue 原始资源值
 * @param selectedClassKey 选中的职业键值
 * @param index 资源索引
 * @returns 资源值
 */
export function computeResourceValue(
  rawValue: number | undefined,
  selectedClassKey: string,
  index: number,
): number {
  if (rawValue === undefined) {
    return getDefaultResourceValue(selectedClassKey, index);
  }
  const scale = getResourceScale(index);
  return Math.floor(rawValue / scale);
}

/**
 * 计算精确的资源值
 * @param rawValue 原始资源值
 * @param selectedClassKey 选中的职业键值
 * @param index 资源索引
 * @returns 精确资源值
 */
export function computePreciseResourceValue(
  rawValue: number | undefined,
  selectedClassKey: string,
  index: number,
): number {
  if (rawValue === undefined) {
    return getDefaultResourceValue(selectedClassKey, index);
  }
  const scale = getResourceScale(index);
  return rawValue / scale;
}

/**
 * 获取资源缩放比例
 * @param index 资源索引
 * @returns 缩放比例
 */
function getResourceScale(index: number): number {
  const RESOURCE_SCALES: Record<number, number> = {
    4: 100,
    5: 100,
  };
  return RESOURCE_SCALES[index] ?? 1;
}

/**
 * 获取默认资源值
 * @param selectedClassKey 选中的职业键值
 * @param index 资源索引
 * @returns 默认资源值
 */
function getDefaultResourceValue(selectedClassKey: string, index: number): number {
  const DEFAULT_RESOURCE_VALUES_BY_CLASS: Record<string, Record<number, number>> = {
    wind_knight: { 4: 130, 5: 130, 6: 6, 7: 6 },
    frost_mage: { 4: 0, 5: 125, 6: 0, 7: 4 },
  };
  return DEFAULT_RESOURCE_VALUES_BY_CLASS[selectedClassKey]?.[index] ?? 0;
}
