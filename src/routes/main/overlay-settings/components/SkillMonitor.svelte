<script lang="ts">
  import { getActiveProfile, updateActiveProfile, createDefaultProfile } from "$lib/profile-store";
  import { findResonanceSkill, searchResonanceSkills, getSkillsByClass, findSkillById, getClassConfigs } from "$lib/skill-mappings";

  let {
    onUpdateProfile,
  }: {
    onUpdateProfile?: (updater: (p: any) => any) => void;
  } = $props();

  const activeProfile = $derived.by(() => getActiveProfile());

  const selectedClassKey = $derived.by(() => activeProfile.selectedClass);
  const monitoredSkillIds = $derived.by(() => activeProfile.monitoredSkillIds);

  let resonanceSearch = $state("");

  const filteredResonanceSkills = $derived.by(() => searchResonanceSkills(resonanceSearch));

  function setSelectedClassAction(classKey: string): void {
    updateActiveProfile((profile) => ({
      ...profile,
      selectedClass: classKey,
      monitoredSkillIds: [],
    }));
  }

  function toggleSkillAction(skillId: number): void {
    updateActiveProfile((profile) => {
      const current = profile.monitoredSkillIds;
      const exists = current.includes(skillId);
      const next = exists
        ? current.filter((id) => id !== skillId)
        : [...current, skillId];
      return { ...profile, monitoredSkillIds: next };
    });
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
    <h2 class="text-base font-semibold text-foreground">监控技能</h2>
    <p class="text-xs text-muted-foreground">
      选择要监控的技能（最多 10 个）
    </p>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <select
      class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      value={selectedClassKey}
      onchange={(event) => setSelectedClassAction((event.currentTarget as HTMLSelectElement).value)}
    >
      {#each getClassConfigs() as config (config.classKey)}
        <option value={config.classKey}>{config.className}</option>
      {/each}
    </select>
    <button
      type="button"
      class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
      onclick={clearSkillsAction}
    >
      清空技能
    </button>
  </div>

  <div class="space-y-2">
    <input
      class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      placeholder="搜索共鸣技能"
      bind:value={resonanceSearch}
    />
    {#if filteredResonanceSkills.length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
        {#each filteredResonanceSkills.slice(0, 40) as skill (skill.skillId)}
          <button
            type="button"
            class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
            title={skill.name}
            onclick={() => toggleSkillAction(skill.skillId)}
          >
            <img
              src={skill.imagePath}
              alt={skill.name}
              class="w-full h-10 object-contain"
            />
          </button>
        {/each}
      </div>
    {/if}
    <div class="text-xs text-muted-foreground">
      已选择技能（点击可取消选择）
    </div>
    <div class="flex flex-wrap gap-2">
      {#each monitoredSkillIds as skillId (skillId)}
        {@const skill = findSkillByIdAction(skillId)}
        <button
          type="button"
          class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
          title={skill?.name ?? `#${skillId}`}
          onclick={() => toggleSkillAction(skillId)}
        >
          {#if skill?.imagePath}
            <img
              src={skill.imagePath}
              alt={skill.name}
              class="w-full h-full object-cover"
            />
          {:else if skillId}
            <div class="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
              #{skillId}
            </div>
          {/if}
        </button>
      {/each}
      {#if monitoredSkillIds.length === 0}
        <div class="text-xs text-muted-foreground">未选择技能</div>
      {/if}
    </div>
  </div>
</div>
