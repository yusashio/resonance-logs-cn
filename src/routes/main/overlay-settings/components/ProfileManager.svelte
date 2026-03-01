<script lang="ts">
  import { createDefaultSkillMonitorProfile } from "$lib/settings-store";
  import { getActiveProfile, addProfile as addProfileAction, renameActiveProfile as renameAction, removeActiveProfile as removeAction, updateActiveProfile, setActiveProfileIndex } from "$lib/profile-store";
  import { findResonanceSkill, searchResonanceSkills, getSkillsByClass, findSkillById, getClassConfigs } from "$lib/skill-mappings";
  import { SETTINGS } from "$lib/settings-store";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const profiles = $derived.by(() => {
    const state = SETTINGS.skillMonitor.state;
    return state.profiles;
  });

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
    return p ?? createDefaultSkillMonitorProfile();
  });

  const selectedClassKey = $derived.by(() => activeProfile.selectedClass);
  const monitoredSkillIds = $derived.by(() => activeProfile.monitoredSkillIds);

  function addProfile(): void {
    addProfileAction();
  }

  function renameActiveProfile(): void {
    renameAction();
  }

  function removeActiveProfile(): void {
    removeAction();
  }

  function setSelectedClass(classKey: string): void {
    updateActiveProfile((profile) => ({
      ...profile,
      selectedClass: classKey,
      monitoredSkillIds: [],
    }));
  }

  function toggleSkillAction(skillId: number): void {
    const current = monitoredSkillIds;
    const exists = current.includes(skillId);
    const next = exists
      ? current.filter((id) => id !== skillId)
      : [...current, skillId];
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredSkillIds: next,
    }));
  }

  function clearSkillsAction(): void {
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredSkillIds: [],
    }));
  }

  function findSkillByIdAction(skillId: number) {
    return findSkillById(selectedClassKey, skillId);
  }
</script>

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
        setActiveProfileIndex(Number((event.currentTarget as HTMLSelectElement).value))}
    >
      {#each profiles as profile, idx (idx)}
        <option value={idx}>{profile.name}</option>
      {/each}
    </select>
    <button
      type="button"
      class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
      onclick={addProfile}
    >
      新建方案
    </button>
    <button
      type="button"
      class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
      onclick={renameAction}
    >
      重命名
    </button>
    <button
      type="button"
      class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors disabled:text-muted-foreground disabled:hover:bg-transparent"
      onclick={removeAction}
      disabled={profiles.length <= 1}
    >
      删除方案
    </button>
  </div>
</div>
