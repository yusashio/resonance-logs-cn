<script lang="ts">
  import { onMount } from "svelte";
  import { onAttributeUpdate, type AttributeUpdatePayload } from "$lib/api";
  import { onBuffUpdateAll, type BuffUpdatePayload, type BuffUpdateState } from "$lib/api";
  import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
  import type { Event } from "@tauri-apps/api/event";

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

  const CLASS_NAME_TO_ATTR_MAP: Record<string, { primaryAttr: { attrId: number; attrName: string }; attackAttr: { attrId: number; attrName: string } }> = {
    "雷影剑士": { primaryAttr: { attrId: 11010, attrName: "力量" }, attackAttr: { attrId: 11330, attrName: "物理攻击" } },
    "冰魔导师": { primaryAttr: { attrId: 11020, attrName: "智力" }, attackAttr: { attrId: 11340, attrName: "魔法攻击" } },
    "青岚骑士": { primaryAttr: { attrId: 11030, attrName: "敏捷" }, attackAttr: { attrId: 11330, attrName: "物理攻击" } },
    "森语者": { primaryAttr: { attrId: 11020, attrName: "智力" }, attackAttr: { attrId: 11340, attrName: "魔法攻击" } },
    "巨刃守护者": { primaryAttr: { attrId: 11010, attrName: "力量" }, attackAttr: { attrId: 11330, attrName: "物理攻击" } },
    "神射手": { primaryAttr: { attrId: 11030, attrName: "敏捷" }, attackAttr: { attrId: 11330, attrName: "物理攻击" } },
    "神盾骑士": { primaryAttr: { attrId: 11010, attrName: "力量" }, attackAttr: { attrId: 11330, attrName: "物理攻击" } },
    "灵魂乐手": { primaryAttr: { attrId: 11020, attrName: "智力" }, attackAttr: { attrId: 11340, attrName: "魔法攻击" } },
  };

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
  let noReviveBuffData = $state<BuffUpdateState | null>(null);

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

    classAttr = classAttrValue;
    attackAttr = attackAttrValue;

    playerAttributes = {
      uid: attrs.uid,
      name: attrs.name,
      className: attrs.className,
      level: attrs.level,
      attributes,
    };
  }

  function updateBuffDisplay(event: Event<BuffUpdatePayload>) {
    const lifeFluctuationBuff = event.payload.buffs.find((b) => b.baseId === LIFE_FLUCTUATION_BUFF_ID);
    const noReviveBuff = event.payload.buffs.find((b) => b.baseId === NO_REVIVE_BUFF_ID);
    
    if (lifeFluctuationBuff) {
      lifeFluctuationBuffData = lifeFluctuationBuff;
      if (!rafId) {
        updateBuffTimer();
      }
    } else {
      lifeFluctuationBuffData = null;
      lifeFluctuationBuffValue = "未激活";
    }
    
    if (noReviveBuff) {
      noReviveBuffActive = true;
      noReviveBuffData = noReviveBuff;
    } else {
      noReviveBuffActive = false;
      noReviveBuffData = null;
    }
  }

  function updateBuffTimer() {
    if (lifeFluctuationBuffData) {
      const now = Date.now();
      const elapsed = now - lifeFluctuationBuffData.receivedAt;
      const remaining = Math.max(0, lifeFluctuationBuffData.durationMs - elapsed);
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
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "background",
        "transparent",
        "important",
      );
      document.body.style.setProperty(
        "background",
        "transparent",
        "important",
      );
    }

    void (async () => {
      try {
        const win = getCurrentWindow();
        const size = await win.innerSize();
        await win.setSize(new PhysicalSize(size.width + 1, size.height + 1));
        await win.setSize(new PhysicalSize(size.width, size.height));
      } catch (error) {
        console.warn("[attr-monitor] resize hack failed", error);
      }
    })();

    const unlistenAttr = onAttributeUpdate((event) => {
      updateDisplay(event.payload);
    });

    const unlistenBuff = onBuffUpdateAll((event) => {
      updateBuffDisplay(event);
    });

    return () => {
      unlistenAttr.then((fn) => fn());
      unlistenBuff.then((fn) => fn());
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });
</script>

<div class="attr-monitor-root" data-tauri-drag-region>
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
      <div class="attr-row">
        <div class="attr-name">生命波动</div>
        <div class="attr-value">{lifeFluctuationBuffValue}</div>
      </div>
    {/if}
    {#if noReviveBuffActive}
      <div class="attr-row no-revive-buff">
        <div class="attr-name">状态</div>
        <div class="attr-value">禁止复活</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .attr-monitor-root {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 8px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.7);
    user-select: none;
    gap: 8px;
    overflow: hidden;
    app-region: drag;
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
    app-region: no-drag;
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

  :global(html),
  :global(body) {
    background: transparent !important;
    width: 100%;
    height: 100%;
    margin: 0;
  }

  :global(body) {
    overflow: hidden;
  }
</style>
