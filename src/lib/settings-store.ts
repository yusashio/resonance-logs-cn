/**
 * @file 此文件包含应用程序的设置存储。
 * 使用 `@tauri-store/svelte` 创建用户设置的持久化存储。
 */
import { RuneStore } from '@tauri-store/svelte';

export const DEFAULT_STATS = {
  totalDmg: true,
  dps: true,
  tdps: false,
  bossDmg: true,
  bossDps: true,
  dmgPct: true,
  critRate: true,
  critDmgRate: true,
  luckyRate: false,
  luckyDmgRate: false,
  hits: false,
  hitsPerMinute: false,
};

export const DEFAULT_HISTORY_STATS = {
  totalDmg: true,
  dps: true,
  tdps: false,
  bossDmg: true,
  bossDps: true,
  dmgPct: true,
  critRate: false,
  critDmgRate: false,
  luckyRate: false,
  luckyDmgRate: false,
  hits: false,
  hitsPerMinute: false,
};

export const DEFAULT_HISTORY_TANKED_STATS = {
  damageTaken: true,
  tankedPS: true,
  tankedPct: true,
  critTakenRate: false,
  critDmgRate: false,
  luckyRate: false,
  luckyDmgRate: false,
  hitsTaken: false,
  hitsPerMinute: false,
};

export const DEFAULT_HISTORY_HEAL_STATS = {
  healDealt: true,
  hps: true,
  healPct: true,
  critHealRate: false,
  critDmgRate: false,
  luckyRate: false,
  luckyDmgRate: false,
  hitsHeal: false,
  hitsPerMinute: false,
};

// 实时表格的默认列顺序（键来自 column-data.ts）
export const DEFAULT_DPS_PLAYER_COLUMN_ORDER = ['totalDmg', 'dps', 'tdps', 'bossDmg', 'bossDps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];
export const DEFAULT_DPS_SKILL_COLUMN_ORDER = ['totalDmg', 'dps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];
export const DEFAULT_HEAL_PLAYER_COLUMN_ORDER = ['totalDmg', 'dps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];
export const DEFAULT_HEAL_SKILL_COLUMN_ORDER = ['totalDmg', 'dps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];
export const DEFAULT_TANKED_PLAYER_COLUMN_ORDER = ['totalDmg', 'dps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];
export const DEFAULT_TANKED_SKILL_COLUMN_ORDER = ['totalDmg', 'dps', 'dmgPct', 'critRate', 'critDmgRate', 'luckyRate', 'luckyDmgRate', 'hits', 'hitsPerMinute'];

// 实时表格的默认排序设置
export const DEFAULT_LIVE_SORT_SETTINGS = {
  dpsPlayers: { sortKey: 'totalDmg', sortDesc: true },
  dpsSkills: { sortKey: 'totalDmg', sortDesc: true },
  healPlayers: { sortKey: 'totalDmg', sortDesc: true },
  healSkills: { sortKey: 'totalDmg', sortDesc: true },
  tankedPlayers: { sortKey: 'totalDmg', sortDesc: true },
  tankedSkills: { sortKey: 'totalDmg', sortDesc: true },
};

export type ShortcutSettingId = keyof typeof DEFAULT_SETTINGS.shortcuts;

export type Point = {
  x: number;
  y: number;
};

export type OverlayPositions = {
  skillCdGroup: Point;
  resourceGroup: Point;
  textBuffPanel: Point;
  specialBuffGroup: Point;
  attrPanel: Point;
  iconBuffPositions: Record<number, Point>;
};

export type OverlaySizes = {
  skillCdGroupScale: number;
  resourceGroupScale: number;
  textBuffPanelScale: number;
  attrPanelScale: number;
  iconBuffSizes: Record<number, number>;
};

export type OverlayVisibility = {
  showSkillCdGroup: boolean;
  showResourceGroup: boolean;
  showAttrPanel: boolean;
};

export type AttrMonitorSettings = {
  enabled: boolean;
};

export type TestPanelSettings = {
  attrMonitorTest: boolean;
  buffMonitorTest: boolean;
  dpsTest: boolean;
  fightResTest: boolean;
};

export type BuffDisplayMode = "individual" | "grouped";

export type BuffGroup = {
  id: string;
  name: string;
  buffIds: number[];
  priorityBuffIds: number[];
  monitorAll: boolean;
  position: Point;
  iconSize: number;
  columns: number;
  rows: number;
  gap: number;
  showName: boolean;
  showTime: boolean;
  showLayer: boolean;
};

export type SkillMonitorProfile = {
  name: string;
  selectedClass: string;
  monitoredSkillIds: number[];
  monitoredBuffIds: number[];
  buffPriorityIds: number[];
  buffDisplayMode: BuffDisplayMode;
  buffGroups: BuffGroup[];
  individualMonitorAllGroup?: BuffGroup | null;
  textBuffMaxVisible: number;
  overlayPositions: OverlayPositions;
  overlaySizes: OverlaySizes;
  overlayVisibility: OverlayVisibility;
};

function createDefaultOverlayPositions(): OverlayPositions {
  return {
    skillCdGroup: { x: 40, y: 40 },
    resourceGroup: { x: 40, y: 170 },
    textBuffPanel: { x: 360, y: 40 },
    specialBuffGroup: { x: 360, y: 220 },
    attrPanel: { x: 40, y: 310 },
    iconBuffPositions: {},
  };
}

function createDefaultOverlaySizes(): OverlaySizes {
  return {
    skillCdGroupScale: 1,
    resourceGroupScale: 1,
    textBuffPanelScale: 1,
    attrPanelScale: 1,
    iconBuffSizes: {},
  };
}

function createDefaultOverlayVisibility(): OverlayVisibility {
  return {
    showSkillCdGroup: true,
    showResourceGroup: true,
    showAttrPanel: true,
  };
}

export function createDefaultBuffGroup(
  name = "新分组",
  index = 1,
): BuffGroup {
  return {
    id: `group_${Date.now()}_${index}`,
    name,
    buffIds: [],
    priorityBuffIds: [],
    monitorAll: false,
    position: { x: 40 + (index - 1) * 40, y: 310 + (index - 1) * 40 },
    iconSize: 44,
    columns: 6,
    rows: 3,
    gap: 6,
    showName: true,
    showTime: true,
    showLayer: true,
  };
}

export const DEFAULT_ATTR_MONITOR_SETTINGS: AttrMonitorSettings = {
  enabled: false,
};

export const DEFAULT_TEST_PANEL_SETTINGS: TestPanelSettings = {
  attrMonitorTest: false,
  buffMonitorTest: false,
  dpsTest: false,
  fightResTest: false,
};

export function createDefaultSkillMonitorProfile(
  name = "默认方案",
  classKey = "wind_knight",
): SkillMonitorProfile {
  return {
    name,
    selectedClass: classKey,
    monitoredSkillIds: [],
    monitoredBuffIds: [],
    buffPriorityIds: [],
    buffDisplayMode: "individual",
    buffGroups: [],
    individualMonitorAllGroup: null,
    textBuffMaxVisible: 10,
    overlayPositions: createDefaultOverlayPositions(),
    overlaySizes: createDefaultOverlaySizes(),
    overlayVisibility: createDefaultOverlayVisibility(),
  };
}

const DEFAULT_GENERAL_SETTINGS = {
  showYourName: "Show Your Name",
  showOthersName: "Show Others' Name",
  showYourAbilityScore: true,
  showOthersAbilityScore: true,
  relativeToTopDPSPlayer: true,
  relativeToTopDPSSkill: true,
  relativeToTopHealPlayer: true,
  relativeToTopHealSkill: true,
  relativeToTopTankedPlayer: true,
  relativeToTopTankedSkill: true,
  shortenAbilityScore: true,
  shortenDps: true,
  shortenTps: true,
  bossOnlyDps: false,
  dungeonSegmentsEnabled: false,
  eventUpdateRateMs: 200,
};

export const DEFAULT_CLASS_COLORS: Record<string, string> = {
  "雷影剑士": "#674598",
  "冰魔导师": "#4de3d1",
  "青岚骑士": "#0099c6",
  "森语者": "#66aa00",
  "巨刃守护者": "#b38915",
  "神射手": "#ffee00",
  "神盾骑士": "#7b9aa2",
  "灵魂乐手": "#ee2e48",
};

export const CLASS_SPEC_MAP: Record<string, string> = {
  "居合": "雷影剑士", "月刃": "Stormblade",
  "冰矛": "冰魔导师", "射线": "Frost Mage",
  "重装": "青岚骑士", "空枪": "Wind Knight",
  "惩击": "森语者", "愈合": "Verdant Oracle",
  "岩盾": "巨刃守护者", "格挡": "Heavy Guardian",
  "狼弓": "神射手", "鹰弓": "Marksman",
  "防盾": "神盾骑士", "光盾": "Shield Knight",
  "狂音": "灵魂乐手", "协奏": "Beat Performer",
};

export const CLASS_SPEC_NAMES = Object.keys(CLASS_SPEC_MAP);

export const DEFAULT_CLASS_SPEC_COLORS: Record<string, string> = {
  // Stormblade
  "居合": "#9b6cf0", "月刃": "#4a2f80",
  // Frost Mage
  "冰矛": "#8ff7ee", "射线": "#2fbfb3",
  // Wind Knight
  "重装": "#4ddff6", "空枪": "#006b8f",
  // Verdant Oracle
  "惩击": "#b9f36e", "愈合": "#3b6d00",
  // Heavy Guardian
  "岩盾": "#e6c25a", "格挡": "#7b5b08",
  // Marksman
  "狼弓": "#fff9a6", "鹰弓": "#cab400",
  // Shield Knight
  "防盾": "#b6d1d6", "光盾": "#4f6b70",
  // Beat Performer
  "狂音": "#ff7b94", "协奏": "#9f1322",
};

export const DEFAULT_FONT_SIZES = {
  xs: 10,    // 超小 - 标签、提示（默认 0.625rem = 10px）
  sm: 12,    // 小 - 次要文本（默认 0.75rem = 12px）
  base: 14,  // 标准 - 默认文本（默认 0.875rem = 14px）
  lg: 16,    // 大 - 强调（默认 1rem = 16px）
  xl: 20,    // 超大 - 标题（默认 1.25rem = 20px）
};

// 实时表格自定义默认值
export const DEFAULT_LIVE_TABLE_SETTINGS = {
  // 玩家行设置
  playerRowHeight: 28,
  playerFontSize: 13,
  playerIconSize: 20,

  // 表头设置
  showTableHeader: true,
  tableHeaderHeight: 24,
  tableHeaderFontSize: 11,
  tableHeaderTextColor: "#a1a1aa",

  // 缩写数字（K、M、%）
  abbreviatedFontSize: 10,

  // 技能行设置（与玩家行分开）
  skillRowHeight: 24,
  skillFontSize: 12,
  skillIconSize: 18,

  skillShowHeader: true,
  skillHeaderHeight: 22,
  skillHeaderFontSize: 10,
  skillHeaderTextColor: "#a1a1aa",
  skillAbbreviatedFontSize: 9,

  // 技能特定行发光/高亮自定义（与玩家行分开）
  skillRowGlowMode: 'gradient-underline' as 'gradient-underline' | 'gradient' | 'solid',
  skillRowGlowOpacity: 0.15,
  skillRowBorderRadius: 0,
  // 行发光/高亮自定义
  // 模式：'gradient-underline'（渐变+霓虹下划线）、'gradient'（仅渐变）、'solid'（纯色填充）
  rowGlowMode: 'gradient-underline' as 'gradient-underline' | 'gradient' | 'solid',
  // 应用于填充的不透明度（0-1）
  rowGlowOpacity: 0.15,
  // 霓虹下划线效果的边框高度（像素）
  rowGlowBorderHeight: 2,
  // 霓虹边框的 box-shadow 扩散/模糊
  rowGlowSpread: 8,
  // 注意：发光始终使用检测到的职业/专精颜色。
  // 行边框自定义
  rowBorderRadius: 0,
};

//（表头预设常量已移除 - 表头默认值已内联到 DEFAULT_SETTINGS 中）

export const FONT_SIZE_LABELS: Record<string, string> = {
  xs: '超小',
  sm: '小',
  base: '标准',
  lg: '大',
  xl: '超大',
};

// 默认自定义主题颜色（基于深色主题）
export type CustomThemeColors = {
  backgroundMain: string;
  backgroundLive: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipFg: string;
  tableTextColor: string;
  tableAbbreviatedColor: string;
};

export const DEFAULT_CUSTOM_THEME_COLORS: CustomThemeColors = {
  backgroundMain: 'rgba(33, 33, 33, 1)',
  backgroundLive: 'rgba(33, 33, 33, 1)',
  foreground: 'rgba(226, 226, 226, 1)',
  surface: 'rgba(41, 41, 41, 1)',
  surfaceForeground: 'rgba(226, 226, 226, 1)',
  primary: 'rgba(166, 166, 166, 1)',
  primaryForeground: 'rgba(33, 33, 33, 1)',
  secondary: 'rgba(64, 64, 64, 1)',
  secondaryForeground: 'rgba(226, 226, 226, 1)',
  muted: 'rgba(56, 56, 56, 1)',
  mutedForeground: 'rgba(138, 138, 138, 1)',
  accent: 'rgba(82, 82, 82, 1)',
  accentForeground: 'rgba(226, 226, 226, 1)',
  destructive: 'rgba(220, 80, 80, 1)',
  destructiveForeground: 'rgba(255, 255, 255, 1)',
  border: 'rgba(74, 74, 74, 1)',
  input: 'rgba(64, 64, 64, 1)',
  tooltipBg: 'rgba(33, 33, 33, 0.92)',
  tooltipBorder: 'rgba(74, 74, 74, 0.55)',
  tooltipFg: 'rgba(226, 226, 226, 1)',
  tableTextColor: '#ffffff',
  tableAbbreviatedColor: '#71717a',
};

// 自定义主题颜色变量的标签
export const CUSTOM_THEME_COLOR_LABELS: Record<string, { label: string; description: string; category: string }> = {
  backgroundMain: { label: '背景（主窗口）', description: '主窗口背景颜色', category: 'Base' },
  backgroundLive: { label: '背景（实时）', description: '实时统计窗口背景颜色', category: 'Base' },
  foreground: { label: '前景', description: '主要文本颜色', category: 'Base' },
  surface: { label: '表面', description: '卡片、弹窗和面板的背景颜色', category: 'Surfaces' },
  surfaceForeground: { label: '表面文本', description: '表面上的文本颜色', category: 'Surfaces' },
  primary: { label: '主色', description: '主要强调色', category: 'Accents' },
  primaryForeground: { label: '主色文本', description: '主色元素上的文本颜色', category: 'Accents' },
  secondary: { label: '次色', description: '次要强调色', category: 'Accents' },
  secondaryForeground: { label: '次色文本', description: '次色元素上的文本颜色', category: 'Accents' },
  muted: { label: '柔和', description: '柔和/低调的背景颜色', category: 'Utility' },
  mutedForeground: { label: '柔和文本', description: '低调的文本颜色', category: 'Utility' },
  accent: { label: '强调', description: '高亮强调色', category: 'Accents' },
  accentForeground: { label: '强调文本', description: '强调色元素上的文本颜色', category: 'Accents' },
  destructive: { label: '破坏性', description: '错误/危险颜色', category: 'Utility' },
  destructiveForeground: { label: '破坏性文本', description: '破坏性元素上的文本颜色', category: 'Utility' },
  border: { label: '边框', description: '边框颜色', category: 'Utility' },
  input: { label: '输入框', description: '输入框背景颜色', category: 'Utility' },
  tableTextColor: { label: '表格文本', description: '实时表格中的文本颜色', category: 'Tables' },
  tableAbbreviatedColor: { label: '后缀颜色', description: '表格中 K、M、% 后缀的颜色', category: 'Tables' },
  tooltipBg: { label: '提示背景', description: '提示框背景颜色', category: 'Tooltip' },
  tooltipBorder: { label: '提示边框', description: '提示框边框颜色', category: 'Tooltip' },
  tooltipFg: { label: '提示文本', description: '提示框文本颜色', category: 'Tooltip' },
};

const DEFAULT_SETTINGS = {
  accessibility: {
    blur: false,
    clickthrough: false,
    classColors: { ...DEFAULT_CLASS_COLORS },
    useClassSpecColors: false,
    classSpecColors: { ...DEFAULT_CLASS_SPEC_COLORS },
    fontSizes: { ...DEFAULT_FONT_SIZES },
    customThemeColors: { ...DEFAULT_CUSTOM_THEME_COLORS },
    // 背景图片设置
    backgroundImage: '' as string,
    backgroundImageEnabled: false,
    backgroundImageMode: 'cover' as 'cover' | 'contain',
    backgroundImageContainColor: 'rgba(0, 0, 0, 1)',
    // 自定义字体设置
    customFontSansEnabled: false,
    customFontSansUrl: '' as string,
    customFontSansName: '' as string,
    customFontMonoEnabled: false,
    customFontMonoUrl: '' as string,
    customFontMonoName: '' as string,
  },
  shortcuts: {
    showLiveMeter: "",
    hideLiveMeter: "",
    toggleLiveMeter: "",
    enableClickthrough: "",
    disableClickthrough: "",
    toggleClickthrough: "",
    resetEncounter: "",
      togglePauseEncounter: "",
    hardReset: "",
    toggleBossHp: "",
    toggleOverlayEdit: "",
  },
  moduleSync: {
    enabled: false,
    apiKey: "",
    baseUrl: "https://your-api-server.com/api/v1",
    autoSyncIntervalMinutes: 0,
    autoUpload: true,
    marketUpload: true,
  },
  skillMonitor: {
    enabled: false,
    enableBuff: false,
    enableTextBuff: false,
    activeProfileIndex: 0,
    profiles: [createDefaultSkillMonitorProfile()] as SkillMonitorProfile[],
  },
  attrMonitor: {
    ...DEFAULT_ATTR_MONITOR_SETTINGS,
  },
  testPanel: {
    ...DEFAULT_TEST_PANEL_SETTINGS,
  },
  live: {
    general: { ...DEFAULT_GENERAL_SETTINGS },
    dpsPlayers: { ...DEFAULT_STATS },
    dpsSkillBreakdown: { ...DEFAULT_STATS },
    healPlayers: { ...DEFAULT_STATS },
    healSkillBreakdown: { ...DEFAULT_STATS },
    tankedPlayers: { ...DEFAULT_STATS },
    tankedSkillBreakdown: { ...DEFAULT_STATS },
    tableCustomization: { ...DEFAULT_LIVE_TABLE_SETTINGS },
    headerCustomization: {
      windowPadding: 12,
      headerPadding: 8,
      showTimer: true,
      showSceneName: true,
      showSegmentInfo: true,
      showResetButton: true,
      showPauseButton: true,
      showBossOnlyButton: true,
      showSettingsButton: true,
      showMinimizeButton: true,
      showTotalDamage: true,
      showTotalDps: true,
      showBossHealth: true,
      showNavigationTabs: true,
      timerLabelFontSize: 12,
      timerFontSize: 18,
      sceneNameFontSize: 14,
      segmentFontSize: 12,
      resetButtonSize: 20,
      resetButtonPadding: 8,
      pauseButtonSize: 20,
      pauseButtonPadding: 8,
      bossOnlyButtonSize: 20,
      bossOnlyButtonPadding: 8,
      settingsButtonSize: 20,
      settingsButtonPadding: 8,
      minimizeButtonSize: 20,
      minimizeButtonPadding: 8,
      totalDamageLabelFontSize: 14,
      totalDamageValueFontSize: 18,
      totalDpsLabelFontSize: 14,
      totalDpsValueFontSize: 18,
      bossHealthLabelFontSize: 14,
      bossHealthNameFontSize: 14,
      bossHealthValueFontSize: 14,
      bossHealthPercentFontSize: 14,
      navTabFontSize: 11,
      navTabPaddingX: 14,
      navTabPaddingY: 6,
    },
  },
  history: {
    general: { ...DEFAULT_GENERAL_SETTINGS },
    dpsPlayers: { ...DEFAULT_HISTORY_STATS },
    dpsSkillBreakdown: { ...DEFAULT_HISTORY_STATS },
    healPlayers: { ...DEFAULT_HISTORY_HEAL_STATS },
    healSkillBreakdown: { ...DEFAULT_HISTORY_STATS },
    tankedPlayers: { ...DEFAULT_HISTORY_TANKED_STATS },
    tankedSkillBreakdown: { ...DEFAULT_HISTORY_STATS },
  },
};

// 我们需要扁平化的设置，以便每次更新都能自动检测新变化
const RUNE_STORE_OPTIONS = { autoStart: true, saveOnChange: true };
export const SETTINGS = {
  accessibility: new RuneStore(
    'accessibility',
    DEFAULT_SETTINGS.accessibility,
    RUNE_STORE_OPTIONS
  ),
  shortcuts: new RuneStore(
    'shortcuts',
    DEFAULT_SETTINGS.shortcuts,
    RUNE_STORE_OPTIONS
  ),
  moduleSync: new RuneStore(
    'moduleSync',
    DEFAULT_SETTINGS.moduleSync,
    RUNE_STORE_OPTIONS
  ),
  skillMonitor: new RuneStore(
    'skillMonitor',
    DEFAULT_SETTINGS.skillMonitor,
    RUNE_STORE_OPTIONS
  ),
  attrMonitor: new RuneStore(
    'attrMonitor',
    DEFAULT_SETTINGS.attrMonitor,
    RUNE_STORE_OPTIONS
  ),
  testPanel: new RuneStore(
    'testPanel',
    DEFAULT_SETTINGS.testPanel,
    RUNE_STORE_OPTIONS
  ),
  live: {
    general: new RuneStore(
      'liveGeneral',
      DEFAULT_SETTINGS.live.general,
      RUNE_STORE_OPTIONS
    ),
    dps: {
      players: new RuneStore(
        'liveDpsPlayers',
        DEFAULT_SETTINGS.live.dpsPlayers,
        RUNE_STORE_OPTIONS
      ),
      skillBreakdown: new RuneStore(
        'liveDpsSkillBreakdown',
        DEFAULT_SETTINGS.live.dpsSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
    heal: {
      players: new RuneStore(
        'liveHealPlayers',
        DEFAULT_SETTINGS.live.healPlayers,
        RUNE_STORE_OPTIONS
      ),
      skillBreakdown: new RuneStore(
        'liveHealSkillBreakdown',
        DEFAULT_SETTINGS.live.healSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
    tanked: {
      players: new RuneStore(
        'liveTankedPlayers',
        DEFAULT_SETTINGS.live.tankedPlayers,
        RUNE_STORE_OPTIONS
      ),
      skills: new RuneStore(
        'liveTankedSkills',
        DEFAULT_SETTINGS.live.tankedSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
    tableCustomization: new RuneStore(
      'liveTableCustomization',
      DEFAULT_SETTINGS.live.tableCustomization,
      RUNE_STORE_OPTIONS
    ),
    headerCustomization: new RuneStore(
      'liveHeaderCustomization',
      DEFAULT_SETTINGS.live.headerCustomization,
      RUNE_STORE_OPTIONS
    ),
    // 列顺序设置
    columnOrder: {
      dpsPlayers: new RuneStore('liveDpsPlayersColumnOrder', { order: DEFAULT_DPS_PLAYER_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
      dpsSkills: new RuneStore('liveDpsSkillsColumnOrder', { order: DEFAULT_DPS_SKILL_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
      healPlayers: new RuneStore('liveHealPlayersColumnOrder', { order: DEFAULT_HEAL_PLAYER_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
      healSkills: new RuneStore('liveHealSkillsColumnOrder', { order: DEFAULT_HEAL_SKILL_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
      tankedPlayers: new RuneStore('liveTankedPlayersColumnOrder', { order: DEFAULT_TANKED_PLAYER_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
      tankedSkills: new RuneStore('liveTankedSkillsColumnOrder', { order: DEFAULT_TANKED_SKILL_COLUMN_ORDER }, RUNE_STORE_OPTIONS),
    },
    // 排序设置
    sorting: {
      dpsPlayers: new RuneStore('liveDpsPlayersSorting', DEFAULT_LIVE_SORT_SETTINGS.dpsPlayers, RUNE_STORE_OPTIONS),
      dpsSkills: new RuneStore('liveDpsSkillsSorting', DEFAULT_LIVE_SORT_SETTINGS.dpsSkills, RUNE_STORE_OPTIONS),
      healPlayers: new RuneStore('liveHealPlayersSorting', DEFAULT_LIVE_SORT_SETTINGS.healPlayers, RUNE_STORE_OPTIONS),
      healSkills: new RuneStore('liveHealSkillsSorting', DEFAULT_LIVE_SORT_SETTINGS.healSkills, RUNE_STORE_OPTIONS),
      tankedPlayers: new RuneStore('liveTankedPlayersSorting', DEFAULT_LIVE_SORT_SETTINGS.tankedPlayers, RUNE_STORE_OPTIONS),
      tankedSkills: new RuneStore('liveTankedSkillsSorting', DEFAULT_LIVE_SORT_SETTINGS.tankedSkills, RUNE_STORE_OPTIONS),
    },
  },
  history: {
    general: new RuneStore(
      'historyGeneral',
      DEFAULT_SETTINGS.history.general,
      RUNE_STORE_OPTIONS
    ),
    dps: {
      players: new RuneStore(
        'historyDpsPlayers',
        DEFAULT_SETTINGS.history.dpsPlayers,
        RUNE_STORE_OPTIONS
      ),
      skillBreakdown: new RuneStore(
        'historyDpsSkillBreakdown',
        DEFAULT_SETTINGS.history.dpsSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
    heal: {
      players: new RuneStore(
        'historyHealPlayers',
        DEFAULT_SETTINGS.history.healPlayers,
        RUNE_STORE_OPTIONS
      ),
      skillBreakdown: new RuneStore(
        'historyHealSkillBreakdown',
        DEFAULT_SETTINGS.history.healSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
    tanked: {
      players: new RuneStore(
        'historyTankedPlayers',
        DEFAULT_SETTINGS.history.tankedPlayers,
        RUNE_STORE_OPTIONS
      ),
      skillBreakdown: new RuneStore(
        'historyTankedSkillBreakdown',
        DEFAULT_SETTINGS.history.tankedSkillBreakdown,
        RUNE_STORE_OPTIONS
      ),
    },
  },
  // 持久化的应用元数据（跟踪用户上次看到的应用版本）
  appVersion: new RuneStore('appVersion', { value: '' }, RUNE_STORE_OPTIONS),
  packetCapture: new RuneStore(
    'packetCapture',
    { method: "WinDivert", npcapDevice: "" },
    RUNE_STORE_OPTIONS
  ),
};

// 创建扁平化的设置对象以保持向后兼容性
export const settings = {
  state: {
    accessibility: SETTINGS.accessibility.state,
    shortcuts: SETTINGS.shortcuts.state,
    moduleSync: SETTINGS.moduleSync.state,
    skillMonitor: SETTINGS.skillMonitor.state,
    attrMonitor: SETTINGS.attrMonitor.state,
    live: {
      general: SETTINGS.live.general.state,
      dps: {
        players: SETTINGS.live.dps.players.state,
        skillBreakdown: SETTINGS.live.dps.skillBreakdown.state,
      },
      heal: {
        players: SETTINGS.live.heal.players.state,
        skillBreakdown: SETTINGS.live.heal.skillBreakdown.state,
      },
      tanked: {
        players: SETTINGS.live.tanked.players.state,
        skills: SETTINGS.live.tanked.skills.state,
      },
      tableCustomization: SETTINGS.live.tableCustomization.state,
      headerCustomization: SETTINGS.live.headerCustomization.state,
      columnOrder: {
        dpsPlayers: SETTINGS.live.columnOrder.dpsPlayers.state,
        dpsSkills: SETTINGS.live.columnOrder.dpsSkills.state,
        healPlayers: SETTINGS.live.columnOrder.healPlayers.state,
        healSkills: SETTINGS.live.columnOrder.healSkills.state,
        tankedPlayers: SETTINGS.live.columnOrder.tankedPlayers.state,
        tankedSkills: SETTINGS.live.columnOrder.tankedSkills.state,
      },
      sorting: {
        dpsPlayers: SETTINGS.live.sorting.dpsPlayers.state,
        dpsSkills: SETTINGS.live.sorting.dpsSkills.state,
        healPlayers: SETTINGS.live.sorting.healPlayers.state,
        healSkills: SETTINGS.live.sorting.healSkills.state,
        tankedPlayers: SETTINGS.live.sorting.tankedPlayers.state,
        tankedSkills: SETTINGS.live.sorting.tankedSkills.state,
      },
    },
    appVersion: SETTINGS.appVersion.state,
    history: {
      general: SETTINGS.history.general.state,
      dps: {
        players: SETTINGS.history.dps.players.state,
        skillBreakdown: SETTINGS.history.dps.skillBreakdown.state,
      },
      heal: {
        players: SETTINGS.history.heal.players.state,
        skillBreakdown: SETTINGS.history.heal.skillBreakdown.state,
      },
      tanked: {
        players: SETTINGS.history.tanked.players.state,
        skillBreakdown: SETTINGS.history.tanked.skillBreakdown.state,
      },
    },
  },
};

// 无障碍辅助功能

// 主题选择已移除 — 应用仅使用由 customThemeColors 控制的 `custom` 主题
