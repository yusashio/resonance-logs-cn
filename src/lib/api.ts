/**
 * @file This file contains type definitions for event payloads and functions for interacting with the backend.
 *
 * @packageDocumentation
 */
import { listen, type UnlistenFn, type Event } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { commands } from "./bindings";
import type {
  Result,
  RawCombatStats as BindingRawCombatStats,
  RawSkillStats as BindingRawSkillStats,
  HistoryEntityData as BindingHistoryEntityData,
} from "./bindings";

export type RawEntityData = BindingHistoryEntityData;
export type BossHealth = {
  uid: number;
  name: string;
  currentHp: number | null;
  maxHp: number | null;
};

export type HeaderInfo = {
  totalDps: number;
  totalDmg: number;
  elapsedMs: number;
  fightStartTimestampMs: number; // Unix timestamp when fight started
  bosses: BossHealth[];
  sceneId: number | null;
  sceneName: string | null;
  currentSegmentType: 'boss' | 'trash' | null;
  currentSegmentName: string | null;
};

export type PlayerRow = {
  uid: number;
  name: string;
  className: string;
  classSpecName: string;
  abilityScore: number;
  totalDmg: number;
  dps: number;
  tdps: number;
  activeTimeMs: number;
  bossDps: number;
  dmgPct: number;
  critRate: number;
  critDmgRate: number;
  luckyRate: number;
  luckyDmgRate: number;
  hits: number;
  hitsPerMinute: number;
  bossDmg: number;
  bossDmgPct: number;
};

export type PlayersWindow = {
  playerRows: PlayerRow[]
};

export type SkillRow = {
  skillId: number;
  name: string;
  totalDmg: number;
  dps: number;
  dmgPct: number;
  critRate: number;
  critDmgRate: number;
  luckyRate: number;
  luckyDmgRate: number;
  hits: number;
  hitsPerMinute: number
};

export type SkillsWindow = {
  currPlayer: PlayerRow[];
  skillRows: SkillRow[]
};

export type SkillCdState = {
  skillLevelId: number;
  beginTime: number;
  duration: number;
  skillCdType: number;
  validCdTime: number;
  receivedAt: number;
  calculatedDuration: number;
  cdAccelerateRate: number;
};

export type SkillCdUpdatePayload = {
  skillCds: SkillCdState[];
};

export type FightResourceState = {
  values: number[];
  receivedAt: number;
};

export type FightResourceUpdatePayload = {
  fightRes: FightResourceState;
};

export type BuffUpdateState = {
  buffUuid: number;
  baseId: number;
  layer: number;
  durationMs: number;
  createTimeMs: number;
  sourceConfigId: number;
};

export type BuffUpdatePayload = {
  buffs: BuffUpdateState[];
};

export type AttributeValue = {
  attrId: number;
  attrName: string;
  value: number | string | boolean;
  attrNumType: number;
};

export type PlayerAttributes = {
  uid: number;
  name: string;
  className: string;
  level: number;
  attributes: AttributeValue[];
};

export type AttributeUpdatePayload = {
  playerAttributes: PlayerAttributes;
};

export type EncounterUpdatePayload = {
  headerInfo: HeaderInfo;
  isPaused: boolean;
};

export type RawCombatStats = BindingRawCombatStats;
export type RawSkillStats = BindingRawSkillStats;
export type RawEntityData = BindingRawEntityData;

export type LiveDataPayload = {
  elapsedMs: number;
  fightStartTimestampMs: number;
  totalDmg: number;
  totalDmgBossOnly: number;
  totalHeal: number;
  localPlayerUid: number;
  sceneId: number | null;
  sceneName: string | null;
  isPaused: boolean;
  bosses: BossHealth[];
  entities: RawEntityData[];
  currentSegmentType: "boss" | "trash" | null;
  currentSegmentName: string | null;
};

export type BossDeathPayload = {
  bossName: string;
};

export type SceneChangePayload = {
  sceneName: string;
};

export type DamageEvent = {
  timestampMs: number;
  attackerId: number;
  targetId: number;
  targetName: string | null;
  targetMonsterTypeId: number | null;
  amount: number;
  isBossTarget: boolean;
  isKillingBlow: boolean;
};

export type Segment = {
  id: number;
  segmentType: 'boss' | 'trash';
  bossEntityId: number | null;
  bossMonsterTypeId: number | null;
  bossName: string | null;
  startedAtMs: number;
  endedAtMs: number | null;
  totalDamage: number;
  hitCount: number;
  events: DamageEvent[];
};

export type DungeonLog = {
  sceneId: number | null;
  sceneName: string | null;
  combatState: 'idle' | 'inCombat';
  segments: Segment[];
};

export type EntityHealth = {
  uid: number;
  name: string;
  currentHp: number | null;
  maxHp: number | null;
  monsterTypeId: number | null;
  entityType: number;
};

export type DungeonReviveInfo = {
  reviveIds: number[];
  reviveMap: Record<number, number>;
};

export type DungeonReviveUpdatePayload = {
  reviveInfo: DungeonReviveInfo;
};

export const getEntityHealth = (): Promise<Result<EntityHealth[], string>> =>
  commands.getEntityHealth();

export type MetricType = "dps" | "heal" | "tanked";

export type PlayersUpdatePayload = {
  metricType: MetricType;
  playersWindow: PlayersWindow;
};

export type SkillsUpdatePayload = {
  metricType: MetricType;
  playerUid: number;
  skillsWindow: SkillsWindow;
};

export type PlayerMetricsResetPayload = {
  segmentName?: string | null;
};

// Event listener functions
export const onEncounterUpdate = (handler: (event: Event<EncounterUpdatePayload>) => void): Promise<UnlistenFn> =>
  listen<EncounterUpdatePayload>("encounter-update", handler);

export const onLiveData = (handler: (event: Event<LiveDataPayload>) => void): Promise<UnlistenFn> =>
  listen<LiveDataPayload>("live-data", handler);

export const onPlayersUpdate = (handler: (event: Event<PlayersUpdatePayload>) => void): Promise<UnlistenFn> =>
  listen<PlayersUpdatePayload>("players-update", handler);

export const onSkillsUpdate = (handler: (event: Event<SkillsUpdatePayload>) => void): Promise<UnlistenFn> =>
  listen<SkillsUpdatePayload>("skills-update", handler);

export const onBossDeath = (handler: (event: Event<BossDeathPayload>) => void): Promise<UnlistenFn> =>
  listen<BossDeathPayload>("boss-death", handler);

export const onSceneChange = (handler: (event: Event<SceneChangePayload>) => void): Promise<UnlistenFn> =>
  listen<SceneChangePayload>("scene-change", handler);

export const onDungeonLogUpdate = (handler: (event: Event<DungeonLog>) => void): Promise<UnlistenFn> =>
  listen<DungeonLog>("log-update", handler);

// Convenience: factory to create metric-filtered listeners
export const makeSkillsUpdateFilter =
  (metric: MetricType) =>
    (handler: (event: Event<SkillsUpdatePayload>) => void): Promise<UnlistenFn> =>
      listen<SkillsUpdatePayload>("skills-update", (event) => {
        if (event.payload.metricType === metric) handler(event);
      });

export const onDpsSkillsUpdate = makeSkillsUpdateFilter("dps");
export const onHealSkillsUpdate = makeSkillsUpdateFilter("heal");
export const onTankedSkillsUpdate = makeSkillsUpdateFilter("tanked");

export const onResetEncounter = (handler: () => void): Promise<UnlistenFn> =>
  listen("reset-encounter", handler);

export const onResetPlayerMetrics = (handler: (event: Event<PlayerMetricsResetPayload>) => void): Promise<UnlistenFn> =>
  listen<PlayerMetricsResetPayload>("reset-player-metrics", handler);

export const onPauseEncounter = (handler: (event: Event<boolean>) => void): Promise<UnlistenFn> =>
  listen<boolean>("pause-encounter", handler);

export const onSkillCdUpdate = (
  handler: (event: Event<SkillCdUpdatePayload>) => void
): Promise<UnlistenFn> =>
  listen<SkillCdUpdatePayload>("skill-cd-update", handler);

export const onFightResUpdate = (
  handler: (event: Event<FightResourceUpdatePayload>) => void
): Promise<UnlistenFn> =>
  listen<FightResourceUpdatePayload>("fight-res-update", handler);

export const onBuffUpdate = (
  handler: (event: Event<BuffUpdatePayload>) => void
): Promise<UnlistenFn> => listen<BuffUpdatePayload>("buff-update", handler);

export const onAttributeUpdate = (
  handler: (event: Event<AttributeUpdatePayload>) => void
): Promise<UnlistenFn> => listen<AttributeUpdatePayload>("attribute-update", handler);

export const onBuffUpdateAll = (
  handler: (event: Event<BuffUpdatePayload>) => void
): Promise<UnlistenFn> => listen<BuffUpdatePayload>("buff-update-all", handler);

export const onDungeonReviveInfoUpdate = (
  handler: (event: Event<DungeonReviveInfo>) => void
): Promise<UnlistenFn> => listen<DungeonReviveInfo>("dungeon-revive-info-update", handler);

// Command wrappers (still using generated bindings)

export const resetEncounter = (): Promise<Result<null, string>> => commands.resetEncounter();
export const togglePauseEncounter = (): Promise<Result<null, string>> => commands.togglePauseEncounter();
export const resetPlayerMetrics = (): Promise<Result<null, string>> => commands.resetPlayerMetrics();
export const enableBlur = (): Promise<void> => commands.enableBlur();
export const disableBlur = (): Promise<void> => commands.disableBlur();
export const getEncounterEntitiesRaw = (
  encounterId: number,
): Promise<Result<RawEntityData[], string>> =>
  commands.getEncounterEntitiesRaw(encounterId);

// New: toggle boss-only DPS filtering on the backend
export const setBossOnlyDps = (enabled: boolean): Promise<Result<null, string>> =>
  commands.setBossOnlyDps(enabled);

export const setDungeonSegmentsEnabled = (enabled: boolean): Promise<Result<null, string>> =>
  commands.setDungeonSegmentsEnabled(enabled);

export const setEventUpdateRateMs = (rateMs: number): Promise<Result<null, string>> =>
  commands.setEventUpdateRateMs(rateMs);

export const getDungeonLog = (): Promise<Result<DungeonLog, string>> =>
  commands.getDungeonLog();

// =========================
// 模组计算器相关 API
// =========================

export type ModulePart = {
  id: number;
  name: string;
  value: number;
};

export type ModuleInfo = {
  name: string;
  config_id: number;
  uuid: number;
  quality: number;
  parts: ModulePart[];
};

export type ModuleSolution = {
  modules: ModuleInfo[];
  score: number;
  attr_breakdown: Record<string, number>;
};

export type OptimizeLatestPayload = {
  targetAttributes: number[];
  excludeAttributes: number[];
  minAttrRequirements?: Record<number, number>;
  useGpu?: boolean;
  minModuleScore?: number;
};

export type ModuleCalcProgressPayload = [number, number]; // [processed, total]

export const onModuleCalcProgress = (
  handler: (event: Event<ModuleCalcProgressPayload>) => void
): Promise<UnlistenFn> =>
  listen<ModuleCalcProgressPayload>("module-calc-progress", handler);

export const onModuleCalcComplete = (
    handler: (event: Event<ModuleSolution[]>) => void
): Promise<UnlistenFn> =>
    listen<ModuleSolution[]>("module-calc-complete", handler);

export const getLatestModules = (): Promise<ModuleInfo[]> =>
  invoke("get_latest_modules");

export const optimizeLatestModules = (
  payload: OptimizeLatestPayload
): Promise<ModuleSolution[]> =>
  invoke("optimize_latest_modules", payload);
