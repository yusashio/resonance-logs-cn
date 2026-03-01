<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import type { ModuleInfo } from "$lib/api";

  type AttrOption = { id: number; label: string };
  type MinReq = { attrId: number | null; value: number | null };

  let {
    attributeOptions = [],
    targetAttributes = $bindable<number[]>([]),
    excludeAttributes = $bindable<number[]>([]),
    minRequirements = $bindable<MinReq[]>([{ attrId: null, value: null }]),
    minModuleScore = $bindable<number>(0),
    modules = [],
  }: {
    attributeOptions: AttrOption[];
    targetAttributes: number[];
    excludeAttributes: number[];
    minRequirements: MinReq[];
    minModuleScore: number;
    modules: ModuleInfo[];
  } = $props();

  function toggle(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function updateMin(idx: number, field: "attrId" | "value", val: number | null) {
    const next = [...minRequirements];
    const current = next[idx] ?? { attrId: null, value: null };
    if (field === "attrId") {
      next[idx] = { attrId: val, value: current.value };
    } else {
      next[idx] = { attrId: current.attrId, value: val };
    }
    minRequirements = next;
  }

  function parseNullableNumber(raw: string): number | null {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function addMin() {
    minRequirements = [...minRequirements, { attrId: null, value: null }];
  }

  function removeMin(idx: number) {
    minRequirements = minRequirements.filter((_, i) => i !== idx);
  }

  function getFilteredCount(): number {
    if (!modules || modules.length === 0) return 0;

    return modules.filter((mod) => {
      const partIds = mod.parts.map((p) => p.id);
      const partMap = new Map(mod.parts.map((p) => [p.id, p.value]));

      if (targetAttributes.length > 0) {
        const hasAll = targetAttributes.every((id) => partIds.includes(id));
        if (!hasAll) return false;
      }

      if (excludeAttributes.length > 0) {
        const hasExcluded = excludeAttributes.some((id) => partIds.includes(id));
        if (hasExcluded) return false;
      }

      for (const req of minRequirements) {
        if (req.attrId !== null && req.value !== null) {
          const partValue = partMap.get(req.attrId);
          if (partValue === undefined || partValue < req.value) {
            return false;
          }
        }
      }

      if (minModuleScore > 0) {
        const totalValue = mod.parts.reduce((sum, p) => sum + p.value, 0);
        if (totalValue < minModuleScore) {
          return false;
        }
      }

      return true;
    }).length;
  }

  const filteredCount = $derived.by(() => getFilteredCount());
  const totalCount = $derived(modules?.length ?? 0);
</script>

<div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4">
  <div class="flex items-center justify-between">
    <div class="text-base font-semibold text-foreground">筛选设置</div>
    {#if totalCount > 0}
      <div class="text-sm text-muted-foreground">
        符合条件的模组: <span class="font-medium text-foreground">{filteredCount}</span> / {totalCount}
      </div>
    {/if}
  </div>

  <div class="space-y-2">
    <div class="text-sm text-muted-foreground">目标属性, 选中后只会计算携带该属性的模组(模组数超过1000时可利用该设置先进行筛选)</div>
    <div class="flex flex-wrap gap-2">
      {#each attributeOptions as opt}
        <Button
          size="sm"
          variant={targetAttributes.includes(opt.id) ? "default" : "outline"}
          onclick={() => (targetAttributes = toggle(targetAttributes, opt.id))}
        >
          {opt.label}
        </Button>
      {/each}
    </div>
  </div>

  <div class="space-y-2">
    <div class="text-sm text-muted-foreground">排除属性</div>
    <div class="flex flex-wrap gap-2">
      {#each attributeOptions as opt}
        <Button
          size="sm"
          variant={excludeAttributes.includes(opt.id) ? "default" : "outline"}
          onclick={() => (excludeAttributes = toggle(excludeAttributes, opt.id))}
        >
          {opt.label}
        </Button>
      {/each}
    </div>
  </div>

  <div class="space-y-2">
    <div class="text-sm text-muted-foreground">最低属性值总和阈值（排除属性值总和低于此值的模组，0表示不限制）</div>
    <div class="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        class="w-32"
        value={minModuleScore}
        onchange={(e) => {
          const val = parseNullableNumber((e.target as HTMLInputElement).value);
          minModuleScore = val ?? 0;
        }}
      />
      <span class="text-sm text-muted-foreground">点</span>
    </div>
  </div>

  <div class="space-y-3">
    <div class="text-sm text-muted-foreground">最小属性要求</div>
    <div class="space-y-2">
      {#each minRequirements as req, idx}
        <div class="flex items-center gap-2">
          <select
            class="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={req.attrId ?? ""}
            onchange={(e) =>
              updateMin(idx, "attrId", parseNullableNumber((e.target as HTMLSelectElement).value))}
          >
            <option value="">选择属性</option>
            {#each attributeOptions as opt}
              <option value={opt.id}>{opt.label}</option>
            {/each}
          </select>
          <Input
            type="number"
            min="0"
            class="w-24"
            value={req.value ?? ""}
            onchange={(e) =>
              updateMin(idx, "value", parseNullableNumber((e.target as HTMLInputElement).value))}
          />
          <Button size="sm" variant="ghost" onclick={() => removeMin(idx)}>移除</Button>
        </div>
      {/each}
    </div>
    <Button size="sm" variant="outline" onclick={addMin}>+ 添加</Button>
  </div>
</div>

