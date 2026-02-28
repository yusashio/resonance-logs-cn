<script lang="ts">
  import { onMount } from "svelte";
  import { onAttributeUpdate, type AttributeUpdatePayload } from "$lib/api";
  import { onBuffUpdate, type BuffUpdatePayload, type BuffUpdateState } from "$lib/api";
  import type { Event } from "@tauri-apps/api/event";
  import classAttributes from "$lib/config/class-attributes.json";

  type AttributeDisplay = {
    attrId: number;
    attrName: string;
    value: string;
    isHighlighted?: boolean;
    attrNumType?: number;
  };

  const DISPLAY_ATTR_IDS = [11720, 11710, 11930, 11780, 11940, 11950, 11970];
  const LIFE_FLUCTUATION_BUFF_ID = 2302421;
  const NO_REVIVE_BUFF_ID = 2110057;
  const HIGHLIGHT_ATTR_IDS = [11710, 11930, 11780, 11940, 11950];

  const ATTR_NAME_MAP: Record<number, string> = {
    11720: "攻速",
    11710: "暴击",
    11930: "急速",
    11780: "幸运",
    11940: "精通",
    11950: "全能",
    11970: "格挡",
    11330: "物理攻击",
    11340: "魔法攻击",
  };

  const CLASS_NAME_TO_ATTR_MAP: Record<string, { primaryAttr: { attrId: number; attrName: string }; attackAttr: { attrId: number; attrName: string } }> = classAttributes as any;

  let { 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();

  function getDefaultAttributes(): AttributeDisplay[] {
    return DISPLAY_ATTR_IDS.map(attrId => ({
      attrId,
      attrName: ATTR_NAME_MAP[attrId] || `属性${attrId}`,
      value: "0%",
      isHighlighted: false,
    }));
  }

  function getDefaultClassAttr(): AttributeDisplay {
    return {
      attrId: 11010,
      attrName: "力量",
      value: "0",
      isHighlighted: false,
    };
  }

  function getDefaultAttackAttr(): AttributeDisplay {
    return {
      attrId: 11330,
      attrName: "物理攻击",
      value: "0",
      isHighlighted: false,
    };
  }

  let playerAttributes = $state({
    uid: 0,
    name: "",
    className: "",
    level: 0,
    attributes: getDefaultAttributes(),
  });
  let lifeFluctuationBuffValue = $state("未激活");
  let lifeFluctuationBuffData = $state<BuffUpdateState | null>(null);
  let rafId: number | null = null;
  let classAttr = $state<AttributeDisplay>(getDefaultClassAttr());
  let attackAttr = $state<AttributeDisplay>(getDefaultAttackAttr());
  let noReviveBuffActive = $state<boolean>(false);

  function updateDisplay(payload: AttributeUpdatePayload) {
    const { playerAttributes: attrs } = payload;
    
    const attrMap = new Map(
      attrs.attributes.map((attr) => [
        attr.attrId,
        {
          attrId: attr.attrId,
          attrName: ATTR_NAME_MAP[attr.attrId] || `属性${attr.attrId}`,
          value: formatValue(attr.value, attr.attrNumType),
          rawValue: typeof attr.value === "number" ? attr.value : 0,
          attrNumType: attr.attrNumType,
        },
      ])
    );
    
    let attributes: (AttributeDisplay & { rawValue: number; attrNumType: number })[] = DISPLAY_ATTR_IDS
      .map((id) => {
        const attrData = attrMap.get(id);
        if (attrData) {
          return attrData;
        } else {
          return {
            attrId: id,
            attrName: ATTR_NAME_MAP[id] || `属性${id}`,
            value: "0%",
            rawValue: 0,
            attrNumType: 1,
          };
        }
      });

    const highlightAttrs = attributes.filter(attr => HIGHLIGHT_ATTR_IDS.includes(attr.attrId));
    const maxAttr = highlightAttrs.reduce((max, attr) => 
      attr.rawValue > max.rawValue ? attr : max
    );

    attributes = attributes.map(attr => ({
      ...attr,
      isHighlighted: attr.attrId === maxAttr.attrId,
    }));

    const classAttrConfig = CLASS_NAME_TO_ATTR_MAP[attrs.className];
    
    let classAttrValue: AttributeDisplay;
    if (classAttrConfig) {
      const classAttrRawValue = attrMap.get(classAttrConfig.primaryAttr.attrId);
      if (classAttrRawValue) {
        classAttrValue = {
          attrId: classAttrConfig.primaryAttr.attrId,
          attrName: classAttrConfig.primaryAttr.attrName,
          value: formatValue(classAttrRawValue.value, classAttrRawValue.attrNumType),
          isHighlighted: false,
        };
      } else {
        classAttrValue = {
          attrId: classAttrConfig.primaryAttr.attrId,
          attrName: classAttrConfig.primaryAttr.attrName,
          value: "0",
          isHighlighted: false,
        };
      }
    } else {
      classAttrValue = {
        attrId: 11010,
        attrName: "力量",
        value: "0",
        isHighlighted: false,
      };
    }

    let attackAttrValue: AttributeDisplay;
    if (classAttrConfig) {
      const attackAttrConfig = classAttrConfig.attackAttr;
      const attackAttrRawValue = attrMap.get(attackAttrConfig.attrId);
      if (attackAttrRawValue) {
        attackAttrValue = {
          attrId: attackAttrConfig.attrId,
          attrName: attackAttrConfig.attrName,
          value: formatValue(attackAttrRawValue.value, attackAttrRawValue.attrNumType),
          isHighlighted: false,
        };
      } else {
        attackAttrValue = {
          attrId: attackAttrConfig.attrId,
          attrName: attackAttrConfig.attrName,
          value: "0",
          isHighlighted: false,
        };
      }
    } else {
      attackAttrValue = {
        attrId: 11330,
        attrName: "物理攻击",
        value: "0",
        isHighlighted: false,
      };
    }

    // 使用 Object.assign 更新对象属性，确保响应式更新
    Object.assign(classAttr, classAttrValue);
    Object.assign(attackAttr, attackAttrValue);
    
    // 更新 playerAttributes
    playerAttributes.uid = attrs.uid;
    playerAttributes.name = attrs.name;
    playerAttributes.className = attrs.className;
    playerAttributes.level = attrs.level;
    playerAttributes.attributes = attributes;
  }

  function updateBuffDisplay(event: Event<BuffUpdatePayload>) {
    const lifeFluctuationBuff = event.payload.buffs.find((b) => b.baseId === LIFE_FLUCTUATION_BUFF_ID);
    const noReviveBuff = event.payload.buffs.find((b) => b.baseId === NO_REVIVE_BUFF_ID);
    
    if (lifeFluctuationBuff) {
      lifeFluctuationBuffData = lifeFluctuationBuff;
      const now = Date.now();
      const end = lifeFluctuationBuff.createTimeMs + lifeFluctuationBuff.durationMs;
      const remaining = Math.max(0, end - now);
      const remainingSeconds = (remaining / 1000).toFixed(1);
      lifeFluctuationBuffValue = `${remainingSeconds}s`;
      if (!rafId) {
        updateBuffTimer();
      }
    } else {
      lifeFluctuationBuffData = null;
      lifeFluctuationBuffValue = "未激活";
    }
    
    if (noReviveBuff) {
      noReviveBuffActive = true;
    } else {
      noReviveBuffActive = false;
    }
  }

  function updateBuffTimer() {
    if (lifeFluctuationBuffData) {
      const now = Date.now();
      const end = lifeFluctuationBuffData.createTimeMs + lifeFluctuationBuffData.durationMs;
      const remaining = Math.max(0, end - now);
      const remainingSeconds = (remaining / 1000).toFixed(1);
      
      lifeFluctuationBuffValue = `${remainingSeconds}s`;
      
      if (remaining > 0) {
        rafId = requestAnimationFrame(updateBuffTimer);
      } else {
        lifeFluctuationBuffValue = "未激活";
        rafId = null;
      }
    } else {
      lifeFluctuationBuffValue = "未激活";
      rafId = null;
    }
  }

  function formatValue(value: any, attrNumType: number): string {
    if (typeof value === "number") {
      if (attrNumType === 1) {
        return `${(value / 100).toFixed(2)}%`;
      }
      if (Number.isInteger(value)) {
        return value.toString();
      }
      return value.toFixed(2);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return String(value);
  }

  onMount(() => {
    // console.log('[AttrPanel] 组件已挂载，开始监听属性更新事件');
    
    const unlistenAttr = onAttributeUpdate((event) => {
      // console.log('[AttrPanel] 收到属性更新事件:', event.payload);
      updateDisplay(event.payload);
    });

    const unlistenBuff = onBuffUpdate((event) => {
      updateBuffDisplay(event);
    });

    return () => {
      // console.log('[AttrPanel] 组件卸载，清理监听器');
      unlistenAttr.then((fn) => fn());
      unlistenBuff.then((fn) => fn());
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });
</script>

<div
  class="attr-monitor-root"
  class:editable={editable}
  on:pointerdown={onPointerDown}
>
  <div class="attributes-list">
    <div class="attr-row class-attr">
      <div class="attr-name">{classAttr.attrName}</div>
      <div class="attr-value">{classAttr.value}</div>
    </div>
    <div class="attr-row attack-attr">
      <div class="attr-name">{attackAttr.attrName}</div>
      <div class="attr-value">{attackAttr.value}</div>
    </div>
    {#each playerAttributes.attributes as attr (attr.attrId)}
      <div class="attr-row" class:highlighted={attr.isHighlighted}>
        <div class="attr-name">{attr.attrName}</div>
        <div class="attr-value" class:highlighted={attr.isHighlighted}>{attr.value}</div>
      </div>
    {/each}
    {#if lifeFluctuationBuffValue}
      <div class="attr-row" class:life-fluctuation={lifeFluctuationBuffValue !== "未激活"}>
        <div class="attr-name">生命波动</div>
        <div class="attr-value">{lifeFluctuationBuffValue}</div>
      </div>
    {/if}
    {#if noReviveBuffActive}
      <div class="attr-row no-revive-buff">
        <div class="attr-name">复活</div>
        <div class="attr-value">禁止</div>
      </div>
    {:else}
      <div class="attr-row">
        <div class="attr-name">复活</div>
        <div class="attr-value">正常</div>
      </div>
    {/if}
  </div>
</div>

{#if editable}
  <div
    class="resize-handle"
    on:pointerdown={onResizeStart}
  ></div>
{/if}

<style>
  .attr-monitor-root {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    user-select: none;
    gap: 4px;
    overflow: hidden;
  }

  .attr-monitor-root:not(.editable) {
    background: rgba(0, 0, 0, 0.7);
    padding: 8px;
  }

  .attr-monitor-root.editable {
    background: transparent;
    padding: 0;
  }

  .attributes-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.3);
  }

  .attributes-list::-webkit-scrollbar {
    width: 6px;
  }

  .attributes-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .attributes-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .attributes-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .attr-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }

  .attr-row.class-attr {
    background: rgba(255, 193, 7, 0.15);
    border: 1px solid rgba(255, 193, 7, 0.3);
  }

  .attr-row.class-attr .attr-name {
    color: #ffc107;
    font-weight: 600;
  }

  .attr-row.class-attr .attr-value {
    color: #ffc107;
    font-weight: 600;
  }

  .attr-row.attack-attr {
    background: rgba(255, 87, 34, 0.15);
    border: 1px solid rgba(255, 87, 34, 0.3);
  }

  .attr-row.attack-attr .attr-name {
    color: #ff5722;
    font-weight: 600;
  }

  .attr-row.attack-attr .attr-value {
    color: #ff5722;
    font-weight: 600;
  }

  .attr-name {
    font-size: 11px;
    color: #e0e0e0;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
    line-height: 1.2;
    pointer-events: none;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .attr-value {
    font-size: 11px;
    font-weight: 500;
    color: #4fc3f7;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
    line-height: 1.2;
    pointer-events: none;
    text-align: right;
  }

  .attr-row.highlighted {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
  }

  .attr-row.highlighted .attr-name,
  .attr-row.highlighted .attr-value {
    color: #81c784;
    text-shadow: 0 0 4px rgba(76, 175, 80, 0.8);
  }

  .attr-value.highlighted {
    color: #81c784;
    text-shadow: 0 0 4px rgba(76, 175, 80, 0.8);
  }

  .attr-row.no-revive-buff {
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.5);
  }

  .attr-row.no-revive-buff .attr-name,
  .attr-row.no-revive-buff .attr-value {
    color: #f44336;
    font-weight: 600;
    text-shadow: 0 0 4px rgba(244, 67, 54, 0.8);
  }

  .attr-row.life-fluctuation {
    background: rgba(33, 150, 243, 0.2);
    border: 1px solid rgba(33, 150, 243, 0.5);
  }

  .attr-row.life-fluctuation .attr-name,
  .attr-row.life-fluctuation .attr-value {
    color: rgba(33, 150, 243, 0.8);
    font-weight: 600;
    text-shadow: 0 0 4px rgb(35, 160, 250);
  }

  .resize-handle {
    position: absolute;
    right: -10px;
    bottom: -10px;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .resize-handle:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
  }
</style>
