<script lang="ts">
  import SettingsSwitch from "../../dps/settings/settings-switch.svelte";
  import { SETTINGS } from "$lib/settings-store";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { getActiveProfile, addProfile, renameActiveProfile, removeActiveProfile, setActiveProfileIndex, createDefaultProfile } from "../lib/profile-store";

  const profiles = $derived.by(() => SETTINGS.skillMonitor.state.profiles);
  const activeProfileIndex = $derived.by(() => {
    const state = SETTINGS.skillMonitor.state;
    return Math.min(
      Math.max(state.activeProfileIndex, 0),
      Math.max(0, profiles.length - 1),
    );
  });

  const activeProfile = $derived.by(() => {
    const state = SETTINGS.skillMonitor.state;
    const p = profiles[activeProfileIndex];
    return p ?? createDefaultProfile();
  });

  const showSkillCdGroup = $derived.by(() => activeProfile.overlayVisibility?.showSkillCdGroup ?? true);
  const showResourceGroup = $derived.by(() => activeProfile.overlayVisibility?.showResourceGroup ?? true);

  function handleSkillCdToggle(enabled: boolean) {
    const profile = SETTINGS.skillMonitor.state.profiles[activeProfileIndex];
    if (profile) {
      profile.overlayVisibility = {
        ...profile.overlayVisibility,
        showSkillCdGroup: enabled
      };
    }
  }

  function handleResourceMonitorToggle(enabled: boolean) {
    const profile = SETTINGS.skillMonitor.state.profiles[activeProfileIndex];
    if (profile) {
      profile.overlayVisibility = {
        ...profile.overlayVisibility,
        showResourceGroup: enabled
      };
    }
  }

  function addProfileAction(): void {
    addProfile();
  }

  function renameActiveProfileAction(): void {
    renameActiveProfile();
  }

  function removeActiveProfileAction(): void {
    removeActiveProfile();
  }

  function setActiveProfileIndexAction(index: number): void {
    setActiveProfileIndex(index);
  }
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] space-y-4">
    <div>
      <h2 class="text-base font-semibold text-foreground">监控设置</h2>
      <p class="text-xs text-muted-foreground">
        控制技能、Buff和属性监控的启用状态
      </p>
    </div>
    <div class="space-y-3">
      <SettingsSwitch
        checked={showSkillCdGroup}
        onchange={(e) => {
          const enabled = (e.currentTarget as HTMLInputElement).checked;
          handleSkillCdToggle(enabled);
        }}
        label="技能CD"
        description="实时推送技能CD数据到悬浮窗口"
      />
      <SettingsSwitch
        checked={showResourceGroup}
        onchange={(e) => {
          const enabled = (e.currentTarget as HTMLInputElement).checked;
          handleResourceMonitorToggle(enabled);
        }}
        label="资源监控"
        description="实时推送战斗资源数据到悬浮窗口"
      />
      <SettingsSwitch
        bind:checked={SETTINGS.skillMonitor.state.enableBuff}
        label="图标Buff"
        description="实时推送图标Buff数据到悬浮窗口"
      />
      <SettingsSwitch
        bind:checked={SETTINGS.skillMonitor.state.enableTextBuff}
        label="文字Buff"
        description="实时推送文字Buff数据到悬浮窗口"
      />
      <SettingsSwitch
        bind:checked={SETTINGS.attrMonitor.state.enabled}
        label="属性监控"
        description="实时推送角色属性数据到悬浮窗口"
      />
    </div>
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div>
      <h2 class="text-base font-semibold text-foreground">配置方案</h2>
      <p class="text-xs text-muted-foreground">
        可创建多个角色监控方案并快速切换
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <select
        class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        value={activeProfileIndex}
        onchange={(event) =>
          setActiveProfileIndexAction(Number((event.currentTarget as HTMLSelectElement).value))}
      >
        {#each profiles as profile, idx (idx)}
          <option value={idx}>{profile.name}</option>
        {/each}
      </select>
      <button
        type="button"
        class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
        onclick={addProfileAction}
      >
        新建方案
      </button>
      <button
        type="button"
        class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
        onclick={renameActiveProfileAction}
      >
        重命名
      </button>
      <button
        type="button"
        class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors disabled:text-muted-foreground disabled:hover:bg-transparent"
        onclick={removeActiveProfileAction}
        disabled={profiles.length <= 1}
      >
        删除方案
      </button>
    </div>
  </div>
</div>
