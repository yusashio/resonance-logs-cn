<script lang="ts">
  import { onMount } from "svelte";
  import { getEntityHealth, onDungeonLogUpdate, type EntityHealth, type MonsterStats } from "$lib/api";
  import monsterNames from "$lib/config/MonsterName.json";
  import { SETTINGS } from "$lib/settings-store";

  const MONSTER_NAMES = monsterNames as Record<number, string>;

  let entityHealthList = $state<EntityHealth[]>([]);
  let currentTargetId = $state<number | null>(null);
  let lastAttackTime = $state<number>(0);
  let updateInterval: number | null = null;

  type MonsterHealthDisplay = {
    uid: number;
    name: string;
    currentHp: number;
    maxHp: number;
    hpPercent: number;
    monsterTypeId: number | null;
  };

  // 从 MonsterStats 中获取最近被攻击的目标（按 lastHitAtMs 排序）
  function updateCurrentTargetFromMonsterStats(monsterStats: MonsterStats[]) {
    console.log('[MonsterHealthPanel] updateCurrentTargetFromMonsterStats:', {
      monsterStatsCount: monsterStats.length,
      currentTargetId
    });
    
    if (monsterStats.length === 0) return;
    
    const now = Date.now();
    // 只考虑最近5秒内被攻击的目标
    const recentStats = monsterStats.filter(s => now - s.lastHitAtMs < 5000);
    
    if (recentStats.length === 0) {
      console.log('[MonsterHealthPanel] No recent targets (within 5s)');
      return;
    }
    
    // 按 lastHitAtMs 降序排序，获取最近被攻击的目标
    const sortedStats = [...recentStats].sort((a, b) => b.lastHitAtMs - a.lastHitAtMs);
    const latestTarget = sortedStats[0];
    
    console.log('[MonsterHealthPanel] Latest target:', latestTarget.targetId, 'lastHitAtMs:', latestTarget.lastHitAtMs);
    
    if (latestTarget.targetId !== currentTargetId) {
      console.log('[MonsterHealthPanel] Updating currentTargetId from', currentTargetId, 'to', latestTarget.targetId);
      currentTargetId = latestTarget.targetId;
      lastAttackTime = now;
    }
  }

  // 从活跃 segment 中获取 MonsterStats
  function getMonsterStatsFromActiveSegment(dungeonLog: any): MonsterStats[] {
    if (!dungeonLog.segments || dungeonLog.segments.length === 0) {
      return [];
    }
    
    // 收集所有未结束的 segment 的 MonsterStats
    const allStats: MonsterStats[] = [];
    for (const segment of dungeonLog.segments) {
      // 检查 segment 是否未结束（endedAtMs 为 null 或 undefined）
      const isActive = segment.endedAtMs === null || segment.endedAtMs === undefined;
      console.log('[MonsterHealthPanel] Segment', segment.id, 'endedAtMs:', segment.endedAtMs, 'isActive:', isActive, 'monsterStats:', segment.monsterStats?.length ?? 0);
      if (isActive && segment.monsterStats) {
        allStats.push(...segment.monsterStats);
      }
    }
    
    return allStats;
  }

  let displayedMonsters = $derived.by<MonsterHealthDisplay[]>(() => {
    const monsters: MonsterHealthDisplay[] = [];
    
    for (const entity of entityHealthList) {
      if (entity.entityType === 10) continue;
      // 移除monsterTypeId的限制，允许没有monsterTypeId的敌人显示
      if (entity.currentHp === null || entity.maxHp === null) continue;
      
      let name = entity.name;
      if (!name && entity.monsterTypeId && MONSTER_NAMES[entity.monsterTypeId]) {
        name = MONSTER_NAMES[entity.monsterTypeId];
      }
      
      const hpPercent = entity.maxHp > 0 ? (entity.currentHp / entity.maxHp) * 100 : 0;
      
      monsters.push({
        uid: entity.uid,
        name: name || `怪物 ${entity.uid}`,
        currentHp: entity.currentHp,
        maxHp: entity.maxHp,
        hpPercent,
        monsterTypeId: entity.monsterTypeId,
      });
    }
    
    return monsters;
  });

  // 优先显示当前攻击目标，如果没有则显示第一个可用目标
  let targetMonster = $derived.by<MonsterHealthDisplay | null>(() => {
    console.log('[MonsterHealthPanel] Computing targetMonster:', {
      displayedMonstersCount: displayedMonsters.length,
      currentTargetId,
      displayedMonstersUids: displayedMonsters.map(m => m.uid)
    });
    
    if (displayedMonsters.length === 0) return null;
    
    // 如果有当前目标且目标仍然存在，显示当前目标
    if (currentTargetId !== null) {
      const target = displayedMonsters.find(m => m.uid === currentTargetId);
      console.log('[MonsterHealthPanel] Looking for target:', currentTargetId, 'Found:', target ? 'Yes' : 'No');
      if (target) return target;
    }
    
    // 否则显示第一个目标
    console.log('[MonsterHealthPanel] Returning first monster:', displayedMonsters[0].uid);
    return displayedMonsters[0];
  });

  const nameFontSize = $derived(SETTINGS.live.headerCustomization.state.bossHealthNameFontSize ?? 14);
  const valueFontSize = $derived(SETTINGS.live.headerCustomization.state.bossHealthValueFontSize ?? 14);
  const percentFontSize = $derived(SETTINGS.live.headerCustomization.state.bossHealthPercentFontSize ?? 14);

  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  function getHpColor(percent: number): string {
    if (percent > 50) return "#51cf66";
    if (percent > 25) return "#ffd43b";
    return "#ff6b6b";
  }

  async function updateHealth() {
    try {
      const res = await getEntityHealth();
      if (res.status === "ok") {
        entityHealthList = res.data;
      }
    } catch (err) {
      console.error("[MonsterHealthPanel] Failed to get entity health:", err);
    }
  }

  onMount(() => {
    updateHealth();
    updateInterval = window.setInterval(updateHealth, 500);
    
    // 监听 DungeonLog 更新以获取当前攻击目标
    const unlisten = onDungeonLogUpdate((event) => {
      console.log('[MonsterHealthPanel] onDungeonLogUpdate received:', {
        hasSegments: !!event.payload.segments,
        segmentsCount: event.payload.segments?.length ?? 0
      });
      const dungeonLog = event.payload;
      if (dungeonLog.segments && dungeonLog.segments.length > 0) {
        // 从活跃的 segment 中获取 MonsterStats
        const activeStats = getMonsterStatsFromActiveSegment(dungeonLog);
        console.log('[MonsterHealthPanel] Active monsterStats count:', activeStats.length);
        updateCurrentTargetFromMonsterStats(activeStats);
      } else {
        console.log('[MonsterHealthPanel] No segments in dungeonLog');
      }
    });
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      unlisten.then(fn => fn());
    };
  });
</script>

<div class="monster-health-panel">
  {#if targetMonster}
    <div class="monster-info">
      <div class="monster-name" style:font-size={`${nameFontSize}px`}>
        {targetMonster.name}
        {#if currentTargetId === targetMonster.uid}
          <span class="target-indicator">●</span>
        {/if}
      </div>
      <div class="monster-hp" style:font-size={`${valueFontSize}px`}>
        <span class="hp-current">{formatNumber(targetMonster.currentHp)}</span>
        <span class="hp-separator">/</span>
        <span class="hp-max">{formatNumber(targetMonster.maxHp)}</span>
      </div>
      <div class="hp-percent" style:font-size={`${percentFontSize}px`}>({targetMonster.hpPercent.toFixed(1)}%)</div>
    </div>
    <div class="hp-bar-container">
      <div 
        class="hp-bar-fill" 
        style:width={`${targetMonster.hpPercent}%`}
        style:background-color={getHpColor(targetMonster.hpPercent)}
      ></div>
    </div>
  {:else}
    <div class="no-monster" style:font-size={`${valueFontSize}px`}>无目标</div>
  {/if}
</div>

<style>
  .monster-health-panel {
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    min-width: 200px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .monster-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .monster-name {
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .target-indicator {
    color: #ff6b6b;
    font-size: 10px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .monster-hp {
    color: #e0e0e0;
    font-family: monospace;
  }

  .hp-current {
    color: #51cf66;
    font-weight: 600;
  }

  .hp-separator {
    color: #888;
    margin: 0 4px;
  }

  .hp-max {
    color: #888;
  }

  .hp-percent {
    color: #888;
    text-align: right;
  }

  .hp-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .hp-bar-fill {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
    border-radius: 3px;
  }

  .no-monster {
    color: #888;
    text-align: center;
    padding: 8px 0;
  }
</style>
