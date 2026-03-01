<script lang="ts">
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { emit } from "@tauri-apps/api/event";
  import SwordsIcon from "virtual:icons/lucide/swords";
  import ExternalLinkIcon from "virtual:icons/lucide/external-link";
  import PlayIcon from "virtual:icons/lucide/play";
  import PenSquareIcon from "virtual:icons/lucide/pen-square";
  import Tabs from "./components/Tabs.svelte";
  import SettingsIcon from "virtual:icons/lucide/settings";
  import SwordIcon from "virtual:icons/lucide/sword";
  import ShieldIcon from "virtual:icons/lucide/shield";
  import HeartIcon from "virtual:icons/lucide/heart";
  import KeyboardIcon from "virtual:icons/lucide/keyboard";
  import FlaskIcon from "virtual:icons/lucide/flask-conical";
  import BasicSettings from "./components/BasicSettings.svelte";
  import SkillSettings from "./components/SkillSettings.svelte";
  import BuffSettings from "./components/BuffSettings.svelte";
  import MonsterHpSettings from "./components/MonsterHpSettings.svelte";
  import ShortcutSettings from "./components/ShortcutSettings.svelte";
  import TestSettings from "./components/TestSettings.svelte";
  import { SETTINGS } from "$lib/settings-store";

  let { children } = $props();

  let activeTab = $state("basic");

  const baseTabs = [
    { id: "basic", label: "基础设置", icon: SettingsIcon },
    { id: "skills", label: "技能设置", icon: SwordIcon },
    { id: "buffs", label: "Buff 设置", icon: ShieldIcon },
    { id: "monsterHp", label: "怪物血量", icon: HeartIcon },
    { id: "shortcuts", label: "快捷键", icon: KeyboardIcon },
  ];

  const devTabs = [
    { id: "test", label: "测试面板", icon: FlaskIcon },
  ];

  const tabs = import.meta.env.DEV ? [...baseTabs, ...devTabs] : baseTabs;

  function handleTabChange(tabId: string): void {
    activeTab = tabId;
  }

  async function toggleOverlayWindow() {
    try {
      const overlayWindow = await WebviewWindow.getByLabel("game-overlay");
      if (overlayWindow !== null) {
        const isVisible = await overlayWindow.isVisible();

        if (isVisible) {
          await overlayWindow.hide();
        } else {
          await overlayWindow.show();
          await overlayWindow.unminimize();
          await overlayWindow.setFocus();
        }
      } else {
        console.warn("Game overlay window not found");
      }
    } catch (err) {
      console.error("Failed to toggle overlay window:", err);
    }
  }

  async function toggleOverlayEditMode() {
    try {
      const overlayWindow = await WebviewWindow.getByLabel("game-overlay");
      if (overlayWindow !== null) {
        const isVisible = await overlayWindow.isVisible();
        if (!isVisible) {
          await overlayWindow.show();
          await overlayWindow.unminimize();
          await overlayWindow.setFocus();
        }
        await emit("overlay-edit-toggle");
      } else {
        console.warn("Game overlay window not found");
      }
    } catch (error) {
      console.error("Failed to toggle overlay edit mode", error);
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between pb-4 flex-shrink-0">
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
        <SwordsIcon class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-foreground">overlay设置</h1>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
        onclick={toggleOverlayWindow}
      >
        <PlayIcon class="w-4 h-4" />
        <span>切换overlay窗口</span>
        <ExternalLinkIcon class="w-3.5 h-3.5 opacity-70" />
      </button>

      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 bg-muted/30 text-foreground font-medium text-sm hover:bg-muted/50 transition-colors shadow-sm"
        onclick={toggleOverlayEditMode}
      >
        <PenSquareIcon class="w-4 h-4" />
        <span>编辑overlay布局</span>
        <ExternalLinkIcon class="w-3.5 h-3.5 opacity-70" />
      </button>
    </div>
  </div>

  <div class="flex-shrink-0 pb-4">
    <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
  </div>

  <div class="flex-1 overflow-y-auto">
    {#if activeTab === "basic"}
      <BasicSettings />
    {:else if activeTab === "skills"}
      <SkillSettings />
    {:else if activeTab === "buffs"}
      <BuffSettings />
    {:else if activeTab === "monsterHp"}
      <MonsterHpSettings />
    {:else if activeTab === "shortcuts"}
      <ShortcutSettings />
    {:else if activeTab === "test" && import.meta.env.DEV}
      <TestSettings />
    {/if}
  </div>
</div>
