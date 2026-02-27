/**
 * @file 工具函数模块 - 提供通用的辅助函数
 * @description 包含数值计算、数组操作、对象处理等通用工具函数
 */

/**
 * 限制数值在指定范围内
 * @param value 要限制的数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的数值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 四舍五入到指定位数
 * @param value 要四舍五入的数值
 * @param decimals 保留的小数位数
 * @returns 四舍五入后的数值
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 计算百分比（避免除零错误）
 * @param part 部分值
 * @param total 总值
 * @param defaultValue 当 total 为 0 时返回的默认值
 * @returns 百分比（0-1 之间）
 */
export function calculatePercent(
  part: number,
  total: number,
  defaultValue: number = 0,
): number {
  if (total === 0) return defaultValue;
  return Math.max(0, Math.min(1, part / total));
}

/**
 * 从数组中移除指定索引的元素
 * @param array 原始数组
 * @param index 要移除的索引
 * @returns 新数组
 */
export function removeAt<T>(array: T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

/**
 * 交换数组中两个位置的元素
 * @param array 原始数组
 * @param index1 第一个位置
 * @param index2 第二个位置
 * @returns 交换后的新数组
 */
export function swapArrayElements<T>(array: T[], index1: number, index2: number): T[] {
  const result = [...array];
  [result[index1], result[index2]] = [result[index2], result[index1]];
  return result;
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 来源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends object, U extends object>(
  target: T,
  source: U,
): T & U {
  const result = { ...target } as T & U;
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
          result[key] = deepMerge(result[key] as object, source[key] as object);
        } else {
          result[key] = { ...source[key] };
        }
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * 检查对象是否为空
 * @param obj 要检查的对象
 * @returns 如果对象为空返回 true，否则返回 false
 */
export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * 获取数组的唯一值
 * @param array 原始数组
 * @returns 去重后的新数组
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * 分割数组为指定大小的块
 * @param array 原始数组
 * @param size 每块的大小
 * @returns 分块后的新数组
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * 创建带有默认值的对象
 * @param values 提供的值
 * @param defaults 默认值
 * @returns 合并后的对象
 */
export function withDefaults<T, U extends Partial<T>>(values: U, defaults: T): T {
  return { ...defaults, ...values };
}
