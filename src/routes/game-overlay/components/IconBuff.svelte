<script lang="ts">
  import type { IconBuffDisplay } from "$lib/game-overlay/lib/transformers";

  let { 
    buff, 
    iconSize, 
    showName, 
    showTime, 
    showLayer, 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    buff: IconBuffDisplay;
    iconSize: number;
    showName: boolean;
    showTime: boolean;
    showLayer: boolean;
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();
</script>

<div
  class="overlay-group icon-buff-cell"
  class:editable={editable}
  class:placeholder={buff.isPlaceholder}
  style:width={`${iconSize + 8}px`}
  on:pointerdown={onPointerDown}
>
  {#if showName && !(buff.specialImages && buff.specialImages.length > 0)}
    <div class="buff-name-label" style:max-width={`${iconSize + 8}px`}>{buff.name.slice(0, 6)}</div>
  {/if}
  <div class="buff-icon-wrap" style:width={`${iconSize}px`} style:height={`${iconSize}px`}>
    {#if buff.specialImages && buff.specialImages.length > 0}
      {#each buff.specialImages as imgSrc (imgSrc)}
        <img src={imgSrc} alt={buff.name} class="special-buff-icon" />
      {/each}
    {:else}
      <img
        src={`/images/buff/${buff.spriteFile}`}
        alt={buff.name}
        class="buff-icon"
      />
    {/if}
    {#if showLayer && !(buff.specialImages && buff.specialImages.length > 0) && buff.layer > 1}
      <div class="layer-badge">{buff.layer}</div>
    {/if}
  </div>
  {#if showTime && !(buff.specialImages && buff.specialImages.length > 0)}
    <div class="buff-time" style:font-size={`${Math.max(10, Math.round(iconSize * 0.26))}px`}>{buff.text}</div>
  {/if}
  {#if editable}
    <div
      class="resize-handle icon"
      on:pointerdown={onResizeStart}
    ></div>
  {/if}
</div>

<style>
  .overlay-group {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .icon-buff-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 52px;
  }

  .icon-buff-cell.placeholder {
    opacity: 0.6;
  }

  .buff-name-label {
    font-size: 10px;
    color: #ffffff;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
    line-height: 1;
    max-width: 52px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .buff-icon-wrap {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
  }

  .buff-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .buff-time {
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
    line-height: 1;
  }

  .layer-badge {
    position: absolute;
    right: 2px;
    top: 2px;
    padding: 1px 4px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.65);
    color: #ffffff;
    font-size: 9px;
    font-weight: 600;
    line-height: 1;
  }

  .special-buff-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .resize-handle {
    position: absolute;
    right: -8px;
    bottom: -8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(255, 140, 0, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    cursor: nwse-resize;
  }

  .editable {
    border: 2px solid rgba(102, 204, 255, 0.9);
    border-radius: 8px;
    background: rgba(20, 36, 56, 0.55);
    padding: 4px 2px;
  }
</style>
