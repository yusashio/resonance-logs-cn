<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import type { ModuleSolution } from "$lib/api";

  let {
    solutions = [],
    onview,
  }: {
    solutions: ModuleSolution[];
    onview?: (solution: ModuleSolution) => void;
  } = $props();

  /**
   * 根据属性数量获取对应的颜色类名
   * 数值越高颜色越突出
   * @param value 属性数值
   * @returns Tailwind颜色类名
   */
  function getAttrColor(value: number): string {
    if (value >= 20) return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    if (value >= 16) return "bg-purple-500/20 text-purple-500 border-purple-500/30";
    if (value >= 12) return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    if (value >= 8) return "bg-green-500/20 text-green-500 border-green-500/30";
    if (value >= 4) return "bg-slate-400/20 text-slate-400 border-slate-400/30";
    return "bg-gray-500/20 text-gray-500 border-gray-500/30";
  }
</script>

{#if !solutions.length}
  <div class="text-sm text-muted-foreground">暂无结果</div>
{:else}
  <div class="overflow-x-auto rounded-lg border border-border/60">
    <table class="min-w-full text-sm">
      <thead class="bg-muted/40 text-muted-foreground">
        <tr>
          <th class="px-3 py-2 text-left">排名</th>
          <th class="px-3 py-2 text-left">总分</th>
          <th class="px-3 py-2 text-left">属性分布</th>
          <th class="px-3 py-2 text-left">操作</th>
        </tr>
      </thead>
      <tbody>
        {#each solutions as sol, idx}
          <tr class="border-t border-border/40">
            <td class="px-3 py-2">{idx + 1}</td>
            <td class="px-3 py-2">{sol.score}</td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-1.5">
                {#each Object.entries(sol.attr_breakdown)
                  .sort((a, b) => b[1] - a[1]) as [name, value]}
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border {getAttrColor(value)}"
                  >
                    {name}+{value}
                  </span>
                {/each}
              </div>
            </td>
            <td class="px-3 py-2">
              <Button size="sm" variant="outline" onclick={() => onview?.(sol)}>查看</Button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

