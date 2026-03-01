<script lang="ts">
  import type { IconBuffDisplay } from "$lib/game-overlay/lib/transformers";

  let { 
    buff, 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    buff: IconBuffDisplay;
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();
</script>

<div
  class="overlay-group text-buff-cell"
  class:editable={editable}
  class:placeholder={buff.isPlaceholder}
  on:pointerdown={onPointerDown}
>
  <div class="buff-name-label">{buff.name.slice(0, 6)}</div>
  <div class="buff-time">{buff.text}</div>
</div>

{#if editable}
  <div
    class="resize-handle"
    on:pointerdown={onResizeStart}
  ></div>
{/if}

<style>
  .overlay-group {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .text-buff-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .text-buff-cell.placeholder {
    opacity: 0.6;
  }

  .buff-name-label {
    font-size: 10px;
    color: #ffffff;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .buff-time {
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
    line-height: 1;
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
