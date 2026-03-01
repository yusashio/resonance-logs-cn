<script lang="ts">
  import type { IconBuffDisplay } from "$lib/game-overlay/lib/transformers";
  import type { BuffGroup } from "$lib/settings-store";

  let { 
    group, 
    buffs, 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    group: BuffGroup;
    buffs: IconBuffDisplay[];
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();
</script>

<div
  class="overlay-group buff-group-container"
  class:editable={editable}
  style:left={`${group.position.x}px`}
  style:top={`${group.position.y}px`}
  on:pointerdown={onPointerDown}
>
  {#if editable}
    <div class="group-tag">{group.name}{group.monitorAll ? "（全部）" : ""}</div>
  {/if}
  <div
    class="buff-group-grid"
    style:grid-template-columns={`repeat(${Math.max(1, group.columns)}, ${group.iconSize + 8}px)`}
    style:grid-template-rows={`repeat(${Math.max(1, group.rows)}, auto)`}
    style:gap={`${Math.max(0, group.gap)}px`}
  >
    {#each buffs as buff (buff.baseId)}
      <div class="icon-buff-cell" class:placeholder={buff.isPlaceholder} style:width={`${group.iconSize + 8}px`}>
        {#if group.showName && !(buff.specialImages && buff.specialImages.length > 0)}
          <div class="buff-name-label" style:max-width={`${group.iconSize + 8}px`}>{buff.name.slice(0, 6)}</div>
        {/if}
        <div class="buff-icon-wrap" style:width={`${group.iconSize}px`} style:height={`${group.iconSize}px`}>
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
          {#if group.showLayer && !(buff.specialImages && buff.specialImages.length > 0) && buff.layer > 1}
            <div class="layer-badge">{buff.layer}</div>
          {/if}
        </div>
        {#if group.showTime && !(buff.specialImages && buff.specialImages.length > 0)}
          <div class="buff-time" style:font-size={`${Math.max(10, Math.round(group.iconSize * 0.26))}px`}>{buff.text}</div>
        {/if}
      </div>
    {/each}
  </div>
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
    gap: 4px;
  }

  .buff-group-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .buff-group-grid {
    display: grid;
    gap: 6px;
  }

  .editable {
    border: 2px solid rgba(102, 204, 255, 0.9);
    border-radius: 10px;
    background: rgba(20, 36, 56, 0.45);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    padding: 8px;
  }

  .group-tag {
    margin-bottom: 6px;
    padding: 3px 7px;
    border-radius: 6px;
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: rgba(255, 140, 0, 0.75);
    border: 1px solid rgba(255, 220, 170, 0.8);
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
</style>
