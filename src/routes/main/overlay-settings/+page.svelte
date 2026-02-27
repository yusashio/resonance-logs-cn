<script lang="ts">
  import Tabs from "./components/Tabs.svelte";
  import BasicSettings from "./components/BasicSettings.svelte";
  import SkillSettings from "./components/SkillSettings.svelte";
  import BuffSettings from "./components/BuffSettings.svelte";
  import TestSettings from "./components/TestSettings.svelte";
  import SettingsIcon from "virtual:icons/lucide/settings";
  import SwordIcon from "virtual:icons/lucide/sword";
  import ShieldIcon from "virtual:icons/lucide/shield";
  import FlaskIcon from "virtual:icons/lucide/flask-conical";

  let activeTab = $state("basic");

  const tabs = [
    { id: "basic", label: "基础设置", icon: SettingsIcon },
    { id: "skills", label: "技能设置", icon: SwordIcon },
    { id: "buffs", label: "Buff 设置", icon: ShieldIcon },
    { id: "test", label: "测试面板", icon: FlaskIcon },
  ];

  function handleTabChange(tabId: string): void {
    activeTab = tabId;
  }
</script>

<div class="space-y-6">
  <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

  <div class="p-4">
    {#if activeTab === "basic"}
      <BasicSettings />
    {:else if activeTab === "skills"}
      <SkillSettings />
    {:else if activeTab === "buffs"}
      <BuffSettings />
    {:else if activeTab === "test"}
      <TestSettings />
    {/if}
  </div>
</div>
