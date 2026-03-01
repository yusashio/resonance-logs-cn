<script lang="ts">
  import { getActiveProfile, updateActiveProfile } from "../lib/profile-store";
  import { findResonanceSkill, searchResonanceSkills, getSkillsByClass, findSkillById, getClassConfigs } from "$lib/skill-mappings";
  import { commands } from "$lib/bindings";

  const activeProfile = $derived.by(() => getActiveProfile());

  const selectedClassKey = $derived.by(() => activeProfile.selectedClass);
  const monitoredSkillIds = $derived.by(() => activeProfile.monitoredSkillIds);

  let resonanceSearch = $state("");

  const classConfigs = $derived.by(() => getClassConfigs());
  const classSkills = $derived.by(() => getSkillsByClass(selectedClassKey));

  const filteredResonanceSkills = $derived.by(() =>
    searchResonanceSkills(resonanceSearch),
  );
  const selectedResonanceSkills = $derived.by(
    () =>
      monitoredSkillIds
        .map((id) => findResonanceSkill(id))
        .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
        .slice(0, 10),
  );

  function setSelectedClassAction(classKey: string): void {
    updateActiveProfile((profile) => ({
      ...profile,
      selectedClass: classKey,
      monitoredSkillIds: [],
    }));
  }

  function toggleSkillAction(skillId: number): void {
    const current = monitoredSkillIds;
    const exists = current.includes(skillId);
    if (exists) {
      updateActiveProfile((profile) => ({
        ...profile,
        monitoredSkillIds: current.filter((id) => id !== skillId),
      }));
      return;
    }
    if (current.length >= 10) return;
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredSkillIds: [...current, skillId],
    }));
  }

  function isSelected(skillId: number): boolean {
    return monitoredSkillIds.includes(skillId);
  }

  function clearSkillsAction(): void {
    updateActiveProfile((profile) => ({ ...profile, monitoredSkillIds: [] }));
  }
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div>
      <h2 class="text-base font-semibold text-foreground">职业选择</h2>
      <p class="text-xs text-muted-foreground">
        支持青岚骑士、冰法、巨刃守护者职业
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each classConfigs as config (config.classKey)}
        <button
          type="button"
          class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {selectedClassKey === config.classKey
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
          onclick={() => setSelectedClassAction(config.classKey)}
        >
          {config.className}
          {#if config.completed === false}
            <span class="text-xs text-muted-foreground ml-1">(未完成)</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-foreground">技能选择</h2>
        <p class="text-xs text-muted-foreground">
          最多监控 10 个技能（2行 x 5列）
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-xs text-muted-foreground">
          已选 {monitoredSkillIds.length}/10
        </div>
        <button
          type="button"
          class="text-xs px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          onclick={clearSkillsAction}
        >
          清空
        </button>
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3">
      {#each classSkills as skill (skill.skillId)}
        <button
          type="button"
          class="relative group rounded-lg border overflow-hidden transition-colors {isSelected(skill.skillId)
            ? 'border-primary ring-1 ring-primary'
            : 'border-border/60 hover:border-border'}"
          onclick={() => toggleSkillAction(skill.skillId)}
        >
          {#if skill.imagePath}
            <img
              src={skill.imagePath}
              alt={skill.name}
              class="w-full h-full object-cover aspect-square"
            />
          {:else}
            <div class="w-full h-full aspect-square flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
              未配置
            </div>
          {/if}
          <div class="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] text-white px-1 py-0.5 truncate">
            {skill.name || `#${skill.skillId}`}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-foreground">共鸣技能</h2>
        <p class="text-xs text-muted-foreground">
          通过搜索选择共鸣技能，与普通技能共享 10 个监控格
        </p>
      </div>
      <div class="text-xs text-muted-foreground">
        已选 {selectedResonanceSkills.length}
      </div>
    </div>

    <input
      class="w-full sm:w-64 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      placeholder="搜索共鸣技能名称"
      bind:value={resonanceSearch}
    />

    {#if resonanceSearch.trim().length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3">
        {#each filteredResonanceSkills as skill (skill.skillId)}
          <button
            type="button"
            class="relative group rounded-lg border overflow-hidden transition-colors {isSelected(skill.skillId)
              ? 'border-primary ring-1 ring-primary'
              : 'border-border/60 hover:border-border'}"
            title={skill.name}
            onclick={() => toggleSkillAction(skill.skillId)}
          >
            <img
              src={skill.imagePath}
              alt={skill.name}
              class="w-full h-full object-contain aspect-square bg-muted/20"
            />
            <div class="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] text-white px-1 py-0.5 truncate">
              {skill.name}
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="text-xs text-muted-foreground">请输入关键词搜索共鸣技能</div>
    {/if}

    <div class="space-y-2">
      <div class="text-xs text-muted-foreground">已选共鸣技能</div>
      <div class="flex flex-wrap gap-2">
        {#each selectedResonanceSkills as skill (skill.skillId)}
          <button
            type="button"
            class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
            title={skill.name}
            onclick={() => toggleSkillAction(skill.skillId)}
          >
            <img
              src={skill.imagePath}
              alt={skill.name}
              class="w-full h-full object-contain"
            />
            <div class="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate">
              {skill.name}
            </div>
          </button>
        {/each}
        {#if selectedResonanceSkills.length === 0}
          <div class="text-xs text-muted-foreground">未选择共鸣技能</div>
        {/if}
      </div>
    </div>
  </div>
</div>
