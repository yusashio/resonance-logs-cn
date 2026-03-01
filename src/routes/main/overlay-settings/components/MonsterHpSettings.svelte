<script lang="ts">
  import { SETTINGS } from "$lib/settings-store";
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] space-y-4">
    <div>
      <h2 class="text-base font-semibold text-foreground">字体大小</h2>
      <p class="text-xs text-muted-foreground">
        自定义怪物血量显示的字体大小
      </p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">怪物名称字号</label>
        <input
          type="number"
          class="w-full rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={SETTINGS.live.headerCustomization.state.bossHealthNameFontSize ?? 14}
          min={8}
          max={32}
          onchange={(e) => {
            SETTINGS.live.headerCustomization.state.bossHealthNameFontSize = Number((e.currentTarget as HTMLInputElement).value);
          }}
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">血量数值字号</label>
        <input
          type="number"
          class="w-full rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={SETTINGS.live.headerCustomization.state.bossHealthValueFontSize ?? 14}
          min={8}
          max={32}
          onchange={(e) => {
            SETTINGS.live.headerCustomization.state.bossHealthValueFontSize = Number((e.currentTarget as HTMLInputElement).value);
          }}
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">百分比字号</label>
        <input
          type="number"
          class="w-full rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={SETTINGS.live.headerCustomization.state.bossHealthPercentFontSize ?? 14}
          min={8}
          max={32}
          onchange={(e) => {
            SETTINGS.live.headerCustomization.state.bossHealthPercentFontSize = Number((e.currentTarget as HTMLInputElement).value);
          }}
        />
      </div>
    </div>
  </div>
</div>
