<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { SETTINGS } from "$lib/settings-store";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

  interface TestPanelConfig {
    id: string;
    label: string;
    description: string;
    panelName: string;
    settingKey: keyof typeof SETTINGS.testPanel.state;
  }

  const testPanels: TestPanelConfig[] = [
    {
      id: "attr-monitor-test",
      label: "属性监控测试",
      description: "显示属性监控测试面板",
      panelName: "attr-monitor-test",
      settingKey: "attrMonitorTest"
    },
    {
      id: "buff-monitor-test",
      label: "Buff 监控测试",
      description: "显示 Buff 监控测试面板",
      panelName: "buff-monitor-test",
      settingKey: "buffMonitorTest"
    },
    {
      id: "dps-test",
      label: "DPS 监控测试",
      description: "显示 DPS 监控测试面板",
      panelName: "dps-test",
      settingKey: "dpsTest"
    },
    {
      id: "fight-res-test",
      label: "战斗资源测试",
      description: "显示战斗资源测试面板",
      panelName: "fight-res-test",
      settingKey: "fightResTest"
    }
  ];

  async function handleTestPanelToggle(panelName: string, settingKey: string) {
    try {
      console.log(`Toggling ${panelName}`);
      const window = await WebviewWindow.getByLabel(panelName);
      if (window) {
        const isVisible = await window.isVisible();
        if (isVisible) {
          await window.hide();
          console.log(`Hidden ${panelName} window`);
          SETTINGS.testPanel.state[settingKey] = false;
        } else {
          await window.show();
          await window.unminimize();
          await window.setFocus();
          console.log(`Shown ${panelName} window`);
          SETTINGS.testPanel.state[settingKey] = true;
        }
      } else {
        console.warn(`${panelName} window not found`);
      }
    } catch (error) {
      console.error(`Failed to toggle ${panelName} window:`, error);
    }
  }

  function getButtonText(panel: TestPanelConfig): string {
    return "打开";
  }
</script>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] space-y-4">
  <div class="space-y-1">
    <h2 class="text-base font-semibold text-foreground">测试面板</h2>
    <p class="text-xs text-muted-foreground">控制测试面板的启用状态</p>
  </div>
  
  <div class="space-y-3">
    {#each testPanels as panel (panel.id)}
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-foreground">{panel.label}</div>
          <div class="text-xs text-muted-foreground">{panel.description}</div>
        </div>
        <Button 
          variant="outline" 
          onclick={() => handleTestPanelToggle(panel.panelName, panel.settingKey)}
          class="shrink-0"
        >
          {getButtonText(panel)}
        </Button>
      </div>
    {/each}
  </div>
</div>
