<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "$lib/profile-store";
  import { setOverlaySectionVisibility, toggleOverlaySectionVisibility, setBuffDisplayMode, setTextBuffMaxVisible } from "$lib/profile-updater";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const activeProfile = $derived.by(() => getActiveProfile());

  const showSkillCdGroup = $derived.by(() => activeProfile.overlayVisibility?.showSkillCdGroup ?? true);
  const showResourceGroup = $derived.by(() => activeProfile.overlayVisibility?.showResourceGroup ?? true);
  const buffDisplayMode = $derived.by(() => activeProfile.buffDisplayMode ?? "individual");
  const textBuffMaxVisible = $derived.by(() => Math.max(1, Math.min(20, activeProfile.textBuffMaxVisible ?? 10)));

  function toggleOverlaySectionVisibilityAction(key: "showSkillCdGroup" | "showResourceGroup"): void {
    updateActiveProfile((profile) => toggleOverlaySectionVisibility(profile, key));
  }

  function setOverlaySectionVisibilityAction(key: "showSkillCdGroup" | "showResourceGroup", checked: boolean): void {
    updateActiveProfile((profile) => setOverlaySectionVisibility(profile, key, checked));
  }

  function setBuffDisplayModeAction(mode: "individual" | "grouped"): void {
    updateActiveProfile((profile) => setBuffDisplayMode(profile, mode));
  }

  function setTextBuffMaxVisibleAction(value: number): void {
    updateActiveProfile((profile) => setTextBuffMaxVisible(profile, value));
  }
</script>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
  <div>
    <h2 class="text-base font-semibold text-foreground">Overlay 区域显示</h2>
    <p class="text-xs text-muted-foreground">
      可分别控制技能区和资源区是否显示（按方案保存）
    </p>
  </div>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {showSkillCdGroup
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => toggleOverlaySectionVisibilityAction("showSkillCdGroup")}
      >
        技能CD区：{showSkillCdGroup ? "显示" : "隐藏"}
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {showResourceGroup
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => toggleOverlaySectionVisibilityAction("showResourceGroup")}
      >
        资源监控区：{showResourceGroup ? "显示" : "隐藏"}
      </button>
    </div>
    <p class="text-xs text-muted-foreground">
      点击按钮切换显示状态（按方案保存）
    </p>
  </div>
</div>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
  <div>
    <h2 class="text-base font-semibold text-foreground">Buff 显示模式</h2>
    <p class="text-xs text-muted-foreground">
      可在独立定位和分组布局间切换，配置会按方案保存
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {buffDisplayMode === 'individual'
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
      onclick={() => setBuffDisplayModeAction("individual")}
    >
      独立模式
    </button>
    <button
      type="button"
      class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {buffDisplayMode === 'grouped'
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
      onclick={() => setBuffDisplayModeAction("grouped")}
    >
      分组模式
    </button>
  </div>
  <label class="block text-xs text-muted-foreground max-w-md">
    无图标 Buff 最大显示数: {textBuffMaxVisible}
    <input
      class="w-full mt-1"
      type="range"
      min="1"
      max="20"
      step="1"
      value={textBuffMaxVisible}
      oninput={(event) => setTextBuffMaxVisibleAction(Number((event.currentTarget as HTMLInputElement).value))}
    />
    <span class="block mt-1">超出上限时，按用户设定的优先级截断显示，避免占满屏幕</span>
  </label>
</div>
