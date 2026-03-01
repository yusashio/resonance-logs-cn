<script lang="ts">
  import type { SkillDisplay } from "$lib/game-overlay/lib/transformers";
  import type { SpecialBuffDisplay } from "$lib/skill-mappings";

  let { 
    skillId, 
    display, 
    skill, 
    derivation, 
    isDerivedActive, 
    resourceValue, 
    resourceRequirement, 
    editable = false, 
    onPointerDown, 
    onResizeStart 
  } = $props<{
    skillId: number;
    display?: SkillDisplay;
    skill?: {
      name: string;
      imagePath: string;
      resourceRequirement?: {
        resourceIndex: number;
        amount: number;
      };
      maxValidCdTime?: number;
      maxCharges?: number;
    };
    derivation?: {
      derivedName: string;
      derivedImagePath: string;
      triggerBuffBaseId: number;
      keepCdWhenDerived?: boolean;
    };
    isDerivedActive: boolean;
    resourceValue: number;
    resourceRequirement?: {
      resourceIndex: number;
      amount: number;
    };
    editable?: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onResizeStart: (e: PointerEvent) => void;
  }>();
</script>

<div
  class="skill-cell"
  class:empty={!skillId}
  class:on-cd={isOnCd}
  class:derived-active={isDerivedActive}
>
  {#if displaySkill?.imagePath}
    <img
      src={displaySkill.imagePath}
      alt={displaySkill.name}
      class="skill-icon"
      class:dimmed={isUnavailable}
    />
  {:else if skillId}
    <div class="skill-fallback">#{skillId}</div>
  {/if}

  {#if effectiveDisplay?.chargesText}
    <div class="charges-badge">{effectiveDisplay.chargesText}</div>
  {/if}

  {#if isOnCd}
    <div class="cd-overlay" style={`--cd-percent: ${percent}`}>
      {#if displayText}
        <span class="cd-text">{displayText}</span>
      {/if}
    </div>
  {/if}
</div>

<div
  class="overlay-group skill-group"
  class:editable={editable}
  style:left={`${position.x}px`}
  style:top={`${position.y}px`}
  style:transform={`scale(${scale})`}
  style:transform-origin="top left"
  on:pointerdown={onPointerDown}
>
  {#if editable}
    <div class="group-tag">技能CD区</div>
  {/if}
  <div class="skill-cd-grid">
    {#each Array(10) as _, idx (idx)}
      {@const skillId = monitoredSkillIds[idx]}
      {@const display = skillId ? displayMap.get(skillId) : undefined}
      {@const skill = skillId ? findAnySkillByBaseId(selectedClassKey, skillId) : undefined}
      {@const derivation = skillId ? findSkillDerivationBySource(selectedClassKey, skillId) : undefined}
      {@const isDerivedActive = derivation ? activeBuffIds.has(derivation.triggerBuffBaseId) : false}
      {@const displaySkill = isDerivedActive && derivation
        ? { name: derivation.derivedName, imagePath: derivation.derivedImagePath }
        : skill}
      {@const effectiveDisplay = isDerivedActive && !derivation?.keepCdWhenDerived ? undefined : display}
      {@const resourceBlocked = skill?.resourceRequirement
        ? getResourceValue(skill.resourceRequirement.resourceIndex) < skill.resourceRequirement.amount
        : false}
      {@const isOnCd = effectiveDisplay?.isActive ?? false}
      {@const isUnavailable = isOnCd || resourceBlocked}
      {@const percent = isOnCd ? effectiveDisplay?.percent ?? 0 : 0}
      {@const displayText = effectiveDisplay?.text ?? ""}
      {@const display = computeDisplay(skillId, cd, now, selectedClassKey)}
      {@const cd = cdMap.get(Math.floor(skillLevelId / 100))}
      {@const skillLevelId = skillId * 100}
      {@const now = Date.now()}
      {@const cdAccelerateRate = Math.max(0, cd?.cdAccelerateRate ?? 0)}
      {@const elapsed = Math.max(0, now - cd?.receivedAt ?? 0)}
      {@const baseDuration = cd?.duration > 0 ? Math.max(1, cd?.duration ?? 1) : 1}
      {@const reducedDuration = cd?.duration > 0 ? Math.max(0, cd?.calculatedDuration ?? 0) : 0}
      {@const validCdScale = cd?.duration > 0 ? reducedDuration / baseDuration : 1}
      {@const scaledValidCdTime = cd?.validCdTime * validCdScale}
      {@const progressed = scaledValidCdTime + elapsed * (1 + cdAccelerateRate)}
      {@const remaining = reducedDuration > 0 ? Math.max(0, reducedDuration - progressed) : 0}
      {@const duration = reducedDuration > 0 ? reducedDuration : 1}
      {@const isOnCd = remaining > 0}
      {@const percent = isOnCd ? Math.min(1, remaining / duration) : 0}
      {@const displayText = isOnCd ? (remaining / 1000).toFixed(1) : ""}
      {@const effectiveDisplay = isOnCd ? { percent, text: displayText } : undefined}
      {@const isUnavailable = isOnCd || resourceBlocked}
      {@const displaySkill = isDerivedActive && derivation
        ? { name: derivation.derivedName, imagePath: derivation.derivedImagePath }
        : skill}
      {@const effectiveDisplay = isDerivedActive && !derivation?.keepCdWhenDerived ? undefined : display}
      {@const resourceBlocked = skill?.resourceRequirement
        ? getResourceValue(skill.resourceRequirement.resourceIndex) < skill.resourceRequirement.amount
        : false}
      {@const isOnCd = effectiveDisplay?.isActive ?? false}
      {@const isUnavailable = isOnCd || resourceBlocked}
      {@const percent = isOnCd ? effectiveDisplay?.percent ?? 0 : 0}
      {@const displayText = effectiveDisplay?.text ?? ""}
    {/each}
  </div>
  {#if editable}
    <div
      class="resize-handle"
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

  .skill-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .skill-cd-grid {
    display: grid;
    grid-template-columns: repeat(5, 52px);
    grid-template-rows: repeat(2, 52px);
    gap: 6px;
  }

  .skill-cell {
    position: relative;
    width: 52px;
    height: 52px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
  }

  .skill-cell.empty {
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .skill-cell.on-cd {
    border-color: rgba(255, 216, 102, 0.85);
    box-shadow: 0 0 8px rgba(255, 216, 102, 0.6);
  }

  .skill-cell.derived-active {
    border-color: rgba(255, 216, 102, 0.85);
    box-shadow: 0 0 8px rgba(255, 216, 102, 0.6);
  }

  .skill-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  .skill-icon.dimmed {
    filter: grayscale(80%) brightness(0.5);
  }

  .skill-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
  }

  .cd-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: conic-gradient(
      rgba(0, 0, 0, 0.65) calc(var(--cd-percent) * 360deg),
      transparent calc(var(--cd-percent) * 360deg)
    );
  }

  .cd-text {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
  }

  .charges-badge {
    position: absolute;
    right: 3px;
    bottom: 3px;
    padding: 1px 4px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.65);
    color: #ffffff;
    font-size: 9px;
    font-weight: 600;
    line-height: 1;
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
</style>
