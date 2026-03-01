<script lang="ts">
  let { 
    resourceValue, 
    resourceIndex, 
    className, 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    resourceValue: number;
    resourceIndex: number;
    className: string;
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();

  function getMaxResourceValue(index: number, classKey: string): number {
    const RESOURCE_SCALES: Record<number, number> = {
      4: 100,
      5: 100,
    };
    const DEFAULT_RESOURCE_VALUES_BY_CLASS: Record<string, Record<number, number>> = {
      wind_knight: { 4: 130, 5: 130, 6: 6, 7: 6 },
      frost_mage: { 4: 0, 5: 125, 6: 0, 7: 4 },
    };
    return DEFAULT_RESOURCE_VALUES_BY_CLASS[classKey]?.[index] ?? 0;
  }
</script>

<div
  class="resources-row"
  on:pointerdown={onPointerDown}
>
  <div class="res-bar-container">
    <img
      src="/images/resource/bar.png"
      alt="资源条"
      class="res-bar-bg"
    />
    <div class="res-bar-fill-mask">
      <div
        class="res-bar-fill"
        style:width={`${Math.min(100, Math.max(0, (resourceValue / getMaxResourceValue(resourceIndex, className)) * 100))}%`}
      ></div>
    </div>
    <div class="res-energy-overlay">
      <div class="res-energy-track">
        <div
          class="res-energy-fill"
          style:width={`${Math.min(100, Math.max(0, (resourceValue / getMaxResourceValue(resourceIndex, className)) * 100))}%`}
        ></div>
      </div>
    </div>
  </div>
  <div class="res-text">{resourceValue}</div>
</div>

{#if editable}
  <div
    class="resize-handle"
    on:pointerdown={onResizeStart}
  ></div>
{/if}

<style>
  .resources-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .res-bar-container {
    position: relative;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .res-bar-bg {
    display: block;
    height: 40px;
    width: auto;
  }

  .res-bar-fill-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .res-bar-fill {
    display: block;
    height: 40px;
    width: auto;
  }

  .res-energy-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 43px 0 29px;
  }

  .res-energy-track {
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    overflow: hidden;
  }

  .res-energy-fill {
    height: 100%;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
    transition: width 100ms linear;
  }

  .res-text {
    position: absolute;
    top: -17px;
    left: 0;
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
  }

  .resize-handle {
    position: absolute;
    right: -10px;
    bottom: -10px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 140, 0, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    cursor: nwse-resize;
  }

  .editable {
    border: 2px solid rgba(102, 204, 255, 0.9);
    border-radius: 10px;
    background: rgba(20, 36, 56, 0.45);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    padding: 8px;
  }
</style>
