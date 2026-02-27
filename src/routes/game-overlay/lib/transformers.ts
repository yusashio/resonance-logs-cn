/**
 * @file 数据转换模块 - 负责数据格式转换和计算逻辑
 * @description 包含 Buff 显示数据转换、技能CD计算、资源值计算等核心业务逻辑
 */

import type {
  BuffUpdateState,
  SkillCdState,
} from "$lib/api";
import type { BuffDefinition } from "$lib/bindings";
import type { SpecialBuffDisplay } from "$lib/skill-mappings";

/**
 * 技能显示数据
 */
export type SkillDisplay = {
  isActive: boolean;
  percent: number;
  text: string;
  chargesText?: string;
};

/**
 * 图标 Buff 显示数据
 */
export type IconBuffDisplay = {
  baseId: number;
  name: string;
  spriteFile: string;
  text: string;
  layer: number;
  isPlaceholder?: boolean;
  specialImages?: string[];
};

/**
 * 文本 Buff 显示数据
 */
export type TextBuffDisplay = {
  baseId: number;
  name: string;
  text: string;
  remainPercent: number;
  layer: number;
  isPlaceholder?: boolean;
};

/**
 * 计算技能CD显示数据
 * @param skillId 技能ID
 * @param cd 技能CD状态
 * @param now 当前时间戳
 * @param skill 技能定义（可选）
 * @returns 技能显示数据，如果不需要显示则返回 null
 */
export function computeSkillDisplay(
  skillId: number,
  cd: SkillCdState,
  now: number,
  skill?: {
    maxValidCdTime?: number;
    maxCharges?: number;
  },
): SkillDisplay | null {
  const cdAccelerateRate = Math.max(0, cd.cdAccelerateRate ?? 0);
  const elapsed = Math.max(0, now - cd.receivedAt);
  const baseDuration = cd.duration > 0 ? Math.max(1, cd.duration) : 1;
  const reducedDuration = cd.duration > 0 ? Math.max(0, cd.calculatedDuration) : 0;
  const validCdScale = cd.duration > 0 ? reducedDuration / baseDuration : 1;
  const scaledValidCdTime = cd.validCdTime * validCdScale;
  const progressed = scaledValidCdTime + elapsed * (1 + cdAccelerateRate);

  // 充能技能（无限CD）
  if (cd.duration === -1 && cd.skillCdType === 1) {
    if (!skill?.maxValidCdTime) return null;
    const chargePercent = Math.max(0, Math.min(1, cd.validCdTime / skill.maxValidCdTime));
    return {
      isActive: chargePercent < 1,
      percent: 1 - chargePercent,
      text: `${Math.round(chargePercent * 100)}%`,
    };
  }

  // 多段技能
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

  // 普通CD技能
  const remaining = reducedDuration > 0 ? Math.max(0, reducedDuration - progressed) : 0;
  const duration = reducedDuration > 0 ? reducedDuration : 1;
  return {
    isActive: remaining > 0,
    percent: remaining > 0 ? Math.min(1, remaining / duration) : 0,
    text: remaining > 0 ? (remaining / 1000).toFixed(1) : "",
  };
}

/**
 * 计算 Buff 显示数据
 * @param buff Buff更新状态
 * @param buffDefinitions Buff定义Map
 * @param buffNameMap Buff名称Map
 * @param specialBuffConfigMap 特殊Buff配置Map
 * @param now 当前时间戳
 * @returns IconBuffDisplay 或 TextBuffDisplay
 */
export function computeBuffDisplay(
  buff: BuffUpdateState,
  buffDefinitions: Map<number, BuffDefinition>,
  buffNameMap: Map<number, string>,
  specialBuffConfigMap: Map<number, SpecialBuffDisplay>,
  now: number,
): IconBuffDisplay | TextBuffDisplay | null {
  const end = buff.createTimeMs + buff.durationMs;
  const remaining = Math.max(0, end - now);
  const remainPercent =
    buff.durationMs > 0 ? Math.min(100, Math.max(0, (remaining / buff.durationMs) * 100)) : 100;

  // 过滤掉已过期的Buff（除了永久Buff用于逻辑判断）
  if (buff.durationMs > 0 && end <= now) {
    return null;
  }

  // 永久Buff且层数为1时，不显示在视觉上
  if (buff.durationMs <= 0 && buff.layer <= 1) {
    return null;
  }

  const def = buffDefinitions.get(buff.baseId);
  const name = def?.name ?? buffNameMap.get(buff.baseId) ?? `#${buff.baseId}`;
  const timeText = buff.durationMs > 0 ? (remaining / 1000).toFixed(1) : "∞";
  
  const specialConfig = specialBuffConfigMap.get(buff.baseId);
  const specialImages = specialConfig
    ? (() => {
        const layer = Math.max(1, buff.layer);
        const layerIdx = Math.min(specialConfig.layerImages.length - 1, layer - 1);
        return specialConfig.layerImages[layerIdx] ?? [];
      })()
    : [];

  if (def?.spriteFile) {
    return {
      baseId: buff.baseId,
      name,
      spriteFile: def.spriteFile,
      text: timeText,
      layer: buff.layer,
      ...(specialImages.length > 0 ? { specialImages } : {}),
    };
  } else {
    return {
      baseId: buff.baseId,
      name,
      text: timeText,
      remainPercent,
      layer: buff.layer,
    };
  }
}

/**
 * 计算资源值（整数）
 * @param rawValue 原始资源值
 * @param classKey 职业键值
 * @param resourceIndex 资源索引
 * @param resourceScales 资源缩放比例
 * @param defaultResourceValues 默认资源值
 * @returns 计算后的资源值
 */
export function computeResourceValue(
  rawValue: number | undefined,
  classKey: string,
  resourceIndex: number,
  resourceScales: Record<number, number>,
  defaultResourceValues: Record<string, Record<number, number>>,
): number {
  if (rawValue === undefined) {
    return defaultResourceValues[classKey]?.[resourceIndex] ?? 0;
  }
  const scale = resourceScales[resourceIndex] ?? 1;
  return Math.floor(rawValue / scale);
}

/**
 * 计算精确的资源值（浮点数）
 * @param rawValue 原始资源值
 * @param classKey 职业键值
 * @param resourceIndex 资源索引
 * @param resourceScales 资源缩放比例
 * @param defaultResourceValues 默认资源值
 * @returns 计算后的精确资源值
 */
export function computePreciseResourceValue(
  rawValue: number | undefined,
  classKey: string,
  resourceIndex: number,
  resourceScales: Record<number, number>,
  defaultResourceValues: Record<string, Record<number, number>>,
): number {
  if (rawValue === undefined) {
    return defaultResourceValues[classKey]?.[resourceIndex] ?? 0;
  }
  const scale = resourceScales[resourceIndex] ?? 1;
  return rawValue / scale;
}

/**
 * 过滤出需要显示的Buff（编辑模式下包含占位符）
 * @param activeBuffs 当前激活的Buff
 * @param monitoredBuffIds 监控的Buff ID列表
 * @param buffDefinitions Buff定义Map
 * @param buffNameMap Buff名称Map
 * @param specialBuffConfigMap 特殊Buff配置Map
 * @param now 当前时间戳
 * @param isEditing 是否处于编辑模式
 * @returns 需要显示的Buff数组
 */
export function filterDisplayBuffs(
  activeBuffs: Map<number, BuffUpdateState>,
  monitoredBuffIds: number[],
  buffDefinitions: Map<number, BuffDefinition>,
  buffNameMap: Map<number, string>,
  specialBuffConfigMap: Map<number, SpecialBuffDisplay>,
  now: number,
  isEditing: boolean,
): (IconBuffDisplay | TextBuffDisplay)[] {
  const result: (IconBuffDisplay | TextBuffDisplay)[] = [];
  const activeBuffIds = new Set<number>();
  const iconIds = new Set<number>();
  const textIds = new Set<number>();

  // 处理当前激活的Buff
  for (const [baseId, buff] of activeBuffs) {
    const display = computeBuffDisplay(buff, buffDefinitions, buffNameMap, specialBuffConfigMap, now);
    if (display) {
      result.push(display);
      activeBuffIds.add(baseId);
      if ("spriteFile" in display) {
        iconIds.add(baseId);
      } else {
        textIds.add(baseId);
      }
    }
  }

  // 编辑模式下添加占位符
  if (isEditing) {
    for (const baseId of monitoredBuffIds) {
      if (iconIds.has(baseId) || textIds.has(baseId)) continue;
      
      const def = buffDefinitions.get(baseId);
      const name = def?.name ?? buffNameMap.get(baseId) ?? `#${baseId}`;
      const specialConfig = specialBuffConfigMap.get(baseId);
      const placeholderSpecialImages =
        specialConfig && specialConfig.layerImages.length > 0
          ? (specialConfig.layerImages[0] ?? [])
          : [];

      if (def?.spriteFile) {
        result.push({
          baseId,
          name,
          spriteFile: def.spriteFile,
          text: "--",
          layer: 1,
          isPlaceholder: true,
          ...(placeholderSpecialImages.length > 0 ? { specialImages: placeholderSpecialImages } : {}),
        });
      } else {
        result.push({
          baseId,
          name,
          text: "--",
          remainPercent: 0,
          layer: 1,
          isPlaceholder: true,
        });
      }
    }
  }

  return result;
}
