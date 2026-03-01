/**
 * @file 拖拽调整模块 - 负责拖拽和调整大小功能
 * @description 包含拖拽状态管理、全局事件处理、位置/尺寸更新逻辑
 */

import type { OverlayPositions, OverlaySizes, BuffGroup } from "$lib/settings-store";
import type { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * 拖拽目标类型
 */
export type DragTarget =
  | { kind: "group"; key: keyof Omit<OverlayPositions, "iconBuffPositions"> }
  | { kind: "iconBuff"; baseId: number }
  | { kind: "buffGroup"; groupId: string }
  | { kind: "individualAllGroup" };

/**
 * 拖拽状态
 */
export type DragState = {
  target: DragTarget;
  startX: number;
  startY: number;
  startPos: { x: number; y: number };
};

/**
 * 调整大小目标类型
 */
export type ResizeTarget =
  | { kind: "group"; key: keyof Omit<OverlaySizes, "iconBuffSizes"> }
  | { kind: "iconBuff"; baseId: number }
  | { kind: "buffGroup"; groupId: string }
  | { kind: "individualAllGroup" };

/**
 * 调整大小状态
 */
export type ResizeState = {
  target: ResizeTarget;
  startX: number;
  startY: number;
  startValue: number;
};

/**
 * 拖拽调整处理器接口
 */
export interface DragResizeHandlers {
  startDrag: (e: PointerEvent, target: DragTarget, startPos: { x: number; y: number }) => void;
  startResize: (e: PointerEvent, target: ResizeTarget, startValue: number) => void;
  onGlobalPointerMove: (e: PointerEvent) => void;
  onGlobalPointerUp: () => void;
}

/**
 * 拖拽调整状态管理
 */
export interface DragResizeState {
  dragState: DragState | null;
  resizeState: ResizeState | null;
}

/**
 * 创建拖拽调整处理器
 * @param setEditMode 设置编辑模式的函数
 * @param getOverlayPositions 获取位置信息的函数
 * @param getOverlaySizes 获取尺寸信息的函数
 * @param setGroupPosition 设置组位置的函数
 * @param setIconBuffPosition 设置图标Buff位置的函数
 * @param setBuffGroupPosition 设置Buff分组位置的函数
 * @param setIndividualAllGroupPosition 设置全部Buff组位置的函数
 * @param setGroupScale 设置组缩放的函数
 * @param setIconBuffSize 设置图标Buff尺寸的函数
 * @param setBuffGroupIconSize 设置Buff分组尺寸的函数
 * @param setIndividualAllGroupIconSize 设置全部Buff组尺寸的函数
 * @param win Tauri窗口实例
 * @returns 拖拽调整处理器
 */
export function createDragResizeHandlers(
  setEditMode: (editing: boolean) => Promise<void>,
  getOverlayPositions: () => OverlayPositions,
  getOverlaySizes: () => OverlaySizes,
  setGroupPosition: (key: keyof Omit<OverlayPositions, "iconBuffPositions">, pos: { x: number; y: number }) => void,
  setIconBuffPosition: (baseId: number, pos: { x: number; y: number }) => void,
  setBuffGroupPosition: (groupId: string, pos: { x: number; y: number }) => void,
  setIndividualAllGroupPosition: (pos: { x: number; y: number }) => void,
  setGroupScale: (key: keyof Omit<OverlaySizes, "iconBuffSizes">, value: number) => void,
  setIconBuffSize: (baseId: number, value: number) => void,
  setBuffGroupIconSize: (groupId: string, value: number) => void,
  setIndividualAllGroupIconSize: (value: number) => void,
  win: ReturnType<typeof getCurrentWindow>,
): {
  handlers: DragResizeHandlers;
  state: DragResizeState;
} {
  let dragState: DragState | null = null;
  let resizeState: ResizeState | null = null;

  function startDrag(e: PointerEvent, target: DragTarget, startPos: { x: number; y: number }) {
    if (!isEditing || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragState = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      startPos,
    };
  }

  function startResize(e: PointerEvent, target: ResizeTarget, startValue: number) {
    if (!isEditing || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizeState = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      startValue,
    };
  }

  function onGlobalPointerMove(e: PointerEvent) {
    if (resizeState) {
      const delta = (e.clientX - resizeState.startX) + (e.clientY - resizeState.startY);
      if (resizeState.target.kind === "group") {
        const nextScale = resizeState.startValue + delta / 300;
        setGroupScale(resizeState.target.key, nextScale);
      } else if (resizeState.target.kind === "individualAllGroup") {
        const nextSize = resizeState.startValue + delta / 2;
        setIndividualAllGroupIconSize(nextSize);
      } else if (resizeState.target.kind === "buffGroup") {
        const nextSize = resizeState.startValue + delta / 2;
        setBuffGroupIconSize(resizeState.target.groupId, nextSize);
      } else {
        const nextSize = resizeState.startValue + delta / 2;
        setIconBuffSize(resizeState.target.baseId, nextSize);
      }
      return;
    }

    if (!dragState) return;
    const nextPos = {
      x: dragState.startPos.x + (e.clientX - dragState.startX),
      y: dragState.startPos.y + (e.clientY - dragState.startY),
    };
    if (dragState.target.kind === "group") {
      setGroupPosition(dragState.target.key, nextPos);
    } else if (dragState.target.kind === "individualAllGroup") {
      setIndividualAllGroupPosition(nextPos);
    } else if (dragState.target.kind === "buffGroup") {
      setBuffGroupPosition(dragState.target.groupId, nextPos);
    } else {
      setIconBuffPosition(dragState.target.baseId, nextPos);
    }
  }

  function onGlobalPointerUp() {
    dragState = null;
    resizeState = null;
  }

  let isEditing = false;

  return {
    handlers: {
      startDrag,
      startResize,
      onGlobalPointerMove,
      onGlobalPointerUp,
    },
    state: {
      get dragState() { return dragState; },
      set dragState(value) { dragState = value; },
      get resizeState() { return resizeState; },
      set resizeState(value) { resizeState = value; },
    },
  };
}
