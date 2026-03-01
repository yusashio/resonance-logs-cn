<script lang="ts">
  import { onDestroy } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { unregister } from "@tauri-apps/plugin-global-shortcut";

  import AlertCircleIcon from "virtual:icons/lucide/alert-circle";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  import { SETTINGS } from "$lib/settings-store";
  import { registerShortcut } from "../../dps/settings/shortcuts.js";
  import type { BaseInput } from "../../dps/settings/settings.js";

  let editingId: string | null = $state(null);

  const modifierOrder = ["ctrl", "shift", "alt", "meta"];
  const MODIFIERS = new SvelteSet(modifierOrder);
  const activeMods = new SvelteSet<string>();
  let mainKey: string | null = $state(null);

  const normalizeModifier = (key: string): string =>
    (
      ({
        control: "ctrl",
        meta: "meta",
        alt: "alt",
        shift: "shift",
      }) as Record<string, string>
    )[key.toLowerCase()] ?? key.toLowerCase();

  function getKeyName(e: KeyboardEvent): string {
    const code = e.code;
    if (code.startsWith("Numpad")) {
      return code;
    }
    return e.key.toLowerCase();
  }

  function currentShortcutString(): string {
    const mods = modifierOrder.filter((m) => activeMods.has(m));
    return mainKey ? [...mods, mainKey].join("+") : mods.join("+");
  }

  function startEdit(shortcut: BaseInput) {
    stopEdit();
    editingId = shortcut.id;
    activeMods.clear();
    mainKey = null;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  }

  function stopEdit() {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    activeMods.clear();
    mainKey = null;
    editingId = null;
  }

  function handleKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    const modKey = normalizeModifier(e.key);
    if (MODIFIERS.has(modKey)) {
      activeMods.add(modKey);
      return;
    }
    mainKey = getKeyName(e);
  }

  function handleKeyUp(e: KeyboardEvent) {
    e.preventDefault();
    const modKey = normalizeModifier(e.key);
    if (MODIFIERS.has(modKey)) {
      activeMods.delete(modKey);
      stopEdit();
      return;
    }
    if (mainKey) {
      const shortcutKey = currentShortcutString();
      const hasMain = !!mainKey;
      if (!hasMain) return;
      const cmd = inputs.find((c) => c.id === editingId);
      if (cmd) {
        unregister(SETTINGS.shortcuts.state[cmd.id]);
        SETTINGS.shortcuts.state[cmd.id] = shortcutKey;
        registerShortcut(cmd.id, shortcutKey);
      }
      stopEdit();
    }
  }

  async function clearShortcut(shortcut: BaseInput, e: MouseEvent) {
    e.preventDefault();
    const existing = SETTINGS.shortcuts.state[shortcut.id];
    if (existing) {
      SETTINGS.shortcuts.state[shortcut.id] = "";
      await unregister(existing);
    }
  }

  onDestroy(stopEdit);

  const inputs: BaseInput[] = [
    { id: "showLiveMeter", label: "显示实时窗口" },
    { id: "hideLiveMeter", label: "隐藏实时窗口" },
    { id: "toggleLiveMeter", label: "切换实时窗口" },
    { id: "toggleOverlayWindow", label: "切换 Overlay 窗口" },
    { id: "enableClickthrough", label: "启用点击穿透" },
    { id: "disableClickthrough", label: "禁用点击穿透" },
    { id: "toggleClickthrough", label: "切换点击穿透" },
    { id: "resetEncounter", label: "重置战斗" },
    { id: "togglePauseEncounter", label: "切换暂停战斗" },
    { id: "toggleBossHp", label: "切换怪物血量显示" },
    { id: "toggleOverlayEdit", label: "切换遮罩编辑模式" },
  ];
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] space-y-4">
    <div>
      <h2 class="text-base font-semibold text-foreground">快捷键设置</h2>
      <p class="text-xs text-muted-foreground">
        配置全局快捷键以控制应用程序功能
      </p>
    </div>
    <Alert.Root class="shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <AlertCircleIcon />
      <Alert.Title>右键可清除快捷键</Alert.Title>
    </Alert.Root>
    <div class="space-y-2">
      {#each inputs as input (input.id)}
        <div class="flex items-center justify-between gap-4 py-2">
          <div class="text-sm font-medium text-foreground">{input.label}</div>
          <Button
            variant="outline"
            class="uppercase min-w-32"
            onclick={() => startEdit(input)}
            oncontextmenu={(e: MouseEvent) => clearShortcut(input, e)}
          >
            {#if editingId === input.id}
              {currentShortcutString() || "请按键"}...
            {:else}
              {SETTINGS.shortcuts.state[input.id] || "未绑定"}
            {/if}
          </Button>
        </div>
      {/each}
    </div>
  </div>
</div>
