// 前后端共用的接口类型。App 和后端都只用 `import type` 引入，运行时不打包这份文件。

export type SiHua = '禄' | '权' | '科' | '忌';
export type ReadingMode = 'ai' | 'rules';

export interface StarView {
  name: string;
  kind: 'major' | 'minor' | 'lucky' | 'sha';
  /** 庙 / 旺 / 得 / 利 / 平 / 不 / 陷 */
  brightness?: string;
  siHua?: SiHua;
}

export interface PalaceView {
  branch: number;
  branchName: string;
  stemName: string;
  /** 宫名，如「官禄宫」 */
  name: string;
  /** 白话主题，如「事业与工作」 */
  topic: string;
  /** 首页摘要卡上的引导问题 */
  question: string;
  majorStars: StarView[];
  otherStars: StarView[];
  isMing: boolean;
  isShen: boolean;
  /** 三方四正：对宫与两个三合宫的地支 */
  related: { branch: number; relation: '对宫' | '三合' }[];
  /** 空宫时借对宫主星 */
  borrowed?: { fromBranch: number; fromName: string; stars: string[] };
  ageRange?: [number, number];
  /** 当前所行大限落在这一宫 */
  isCurrentDaXian: boolean;
}

export interface DaXianView {
  startAge: number;
  endAge: number;
  palaceBranch: number;
  palaceName: string;
  /** 大限宫干 */
  stemName: string;
  /** 大限宫干四化：四化 → 星名 */
  siHua: Record<SiHua, string>;
}

/** 格局说明；条件可选，以兼容已经保存的旧解读。 */
export interface PatternEvidence {
  name: string;
  description: string;
  source?: string;
  /** 编辑过的白话含义，区别于传统说明。 */
  plain?: string;
  required?: string[];
  bonus?: string[];
  breaking?: string[];
}

export interface PatternView extends PatternEvidence {
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  palaces: string[];
  required: string[];
  bonus: string[];
  breaking: string[];
}

export interface StarInfo {
  name: string;
  kind: StarView['kind'];
  /** 传统关键词，如「荫护·医药·长辈」 */
  keywords?: string;
  nature?: string;
  element?: string;
  /** 白话特质与需要留意的一面 */
  trait?: string;
  watch?: string;
  /** 古籍参考：原文、白话意思、出处 */
  quotes: ClassicRef[];
  /** 这张盘里这颗星在哪一宫、亮度和生年四化 */
  inChart?: { palaceBranch: number; palaceName: string; brightness?: string; brightnessPlain?: string; siHua?: SiHua; siHuaPlain?: string };
}

export interface ChartView {
  /** 由出生资料算出的稳定 id；示例盘为 "sample" */
  id: string;
  kind: 'sample' | 'personal';
  title: string;
  /** 如「1995.06.15 · 巳时 · 女」 */
  summary: string;
  meta: {
    lunar: string;
    fourPillars?: string[];
    wuxingJu: string;
    mingZhu?: string;
    shenZhu?: string;
    yinYangGender?: string;
  };
  /** 排盘口径说明：真太阳时、晚子时换日、夏令时等 */
  notes: string[];
  /** 出生时间离时辰交界的分钟数，越小越要核实 */
  boundaryMinutes?: number;
  palaces: PalaceView[];
  daXians: DaXianView[];
  /** 当前所行大限在 daXians 里的下标，-1 表示还没起运 */
  currentDaXianIndex: number;
  /** 虚岁 */
  currentAge: number;
  /** 生年四化：年干 + 四颗化星落在哪一宫 */
  birthSiHua: { stemName: string; items: { siHua: SiHua; star: string; palaceBranch: number }[] };
  patterns: PatternView[];
  mingSummary: { stars: string[]; keywords: string[]; nature: string };
  mingBranch: number;
  shenBranch: number;
  /** 首次进入默认选中的宫位（官禄宫） */
  defaultBranch: number;
}

export type BirthTime =
  | { status: 'exact'; hour: number; minute: number }
  | { status: 'approx'; note?: string }
  | { status: 'unknown' };

export interface BirthInput {
  nickname?: string;
  gender: 'male' | 'female';
  calendar: 'solar' | 'lunar';
  year: number;
  month: number;
  day: number;
  isLeapMonth?: boolean;
  time: BirthTime;
  place?: { province: string; city: string; longitude: number };
  /** 用户确认填的是当年夏令时的钟表读数，排盘前减 60 分钟 */
  dstClock?: boolean;
}

export interface MeResponse {
  birth: BirthInput | null;
  chart: ChartView;
  /** 资料已保存但还不能排出确定的个人命盘 */
  pending?: { reason: 'time_unknown' | 'time_approx'; message: string };
  ai: { enabled: boolean };
}

export interface EvidenceItem {
  label: string;
  detail: string;
  source?: string;
}

/** 一句古籍参考。正文只用白话，原文放在页面下方「古籍参考」里。 */
export interface ClassicRef {
  /** 原文（维基文库公版《紫微斗数全书》，只删不改） */
  text: string;
  /** 这句话的白话意思 */
  plain: string;
  /** 出处，如「《紫微斗数全书》卷二 · 财帛」 */
  source: string;
  /** 对照你的盘：原文条件和这张盘对不上、星是借来的等说明 */
  fit?: string;
}

export interface PalaceEvidence {
  facts: EvidenceItem[];
  tradition: EvidenceItem[];
  /** 古籍参考，最多 3 句 */
  classics: ClassicRef[];
  /** 一句都不列时的原因（如疾厄宫不列疾病断语） */
  classicsNote?: string;
  related: { branch: number; name: string; topic: string; relation: '对宫' | '三合'; stars: string[] }[];
  patterns: PatternEvidence[];
  unknowns: string[];
}

export interface PalaceReading {
  chartId: string;
  branch: number;
  mode: ReadingMode;
  headline: string;
  plain: string;
  steps: { title: string; body: string }[];
  reflect: string[];
  suggestions: string[];
  evidence: PalaceEvidence;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** 追问记录保存在服务端，按「命盘 + 宫位」分线程 */
export interface ThreadMessage extends ChatTurn {
  id: string;
  mode?: ReadingMode;
  basis: string[];
  followups: string[];
  createdAt: string;
}

export interface AskRequest {
  branch: number;
  question: string;
}

export interface AskResponse {
  mode: ReadingMode;
  answer: string;
  basis: string[];
  followups: string[];
}

export interface ThreadResponse {
  messages: ThreadMessage[];
}

/** 问答记录里的一条：一问一答。id 是问题那条消息的 id */
export interface AskHistoryItem {
  id: string;
  chartId: string;
  /** 是不是用户现在的命盘；改过出生资料后，旧命盘上的问答仍保留 */
  isCurrentChart: boolean;
  branch: number;
  palace: string;
  question: string;
  answer?: string;
  mode?: 'ai' | 'rules';
  basis: string[];
  createdAt: string;
}

export interface AskHistoryResponse {
  items: AskHistoryItem[];
  /** 还有更早的就给出下一页的游标（传给 ?before=） */
  next?: string;
}

export interface DayTransform {
  siHua: SiHua;
  star: string;
  palaceName: string;
  palaceBranch: number;
  topic: string;
}

export interface DayContext {
  date: string;
  weekday: string;
  lunarLabel: string;
  dayGanZhi: string;
  transforms: DayTransform[];
}

export interface DailyRequest {
  date: string;
  image?: { base64: string; mediaType: 'image/jpeg' | 'image/png' };
  note?: string;
}

export interface DailyReading {
  mode: ReadingMode;
  chartId: string;
  chartKind: ChartView['kind'];
  day: DayContext;
  title: string;
  photoTitle: string;
  seen: string;
  chartAngle: string;
  smallThing: string;
  basis: string[];
  caution?: string;
}

export interface RecordItem {
  id: string;
  date: string;
  note?: string;
  /** data URI，小尺寸缩略图 */
  thumb?: string;
  reading: DailyReading;
  createdAt: string;
}

export interface SaveRecordRequest {
  date: string;
  note?: string;
  thumb?: string;
  reading: DailyReading;
}

export interface PlacesResponse {
  provinces: { name: string; cities: { name: string; longitude: number }[] }[];
}

export interface ApiError {
  error: string;
  message: string;
}

/** 历史同盘里的一位人物 */
export interface PeerView {
  /** same = 命宫完全一样；star = 命宫有相同主星；shen = 身宫在同一宫 */
  level: 'same' | 'star' | 'shen';
  name: string;
  seal: string;
  years: string;
  who: string;
  born: string;
  /** 出生资料的出处 */
  src: string;
  /** 他的命宫，如「丑宫 · 太阳(不)·化禄、太阴(庙)·化科」 */
  ming: string;
  shen: string;
  /** 和你的异同 */
  diff: string;
  story?: string;
  ref?: { text: string; source: string };
}

export interface PeersResponse {
  /** 你的命宫 */
  ming: string;
  peers: PeerView[];
}

/** 全盘解读里的一宫：ready = 已经写好（大模型版，或大模型失败后的规则版）；writing = 还在写，先给规则版 */
export interface ChartReadingItem {
  branch: number;
  status: 'ready' | 'writing';
  reading: PalaceReading;
}

/** 全盘解读：12 宫从命宫起按传统顺序排 */
export interface ChartReadingResponse {
  chartId: string;
  items: ChartReadingItem[];
}

export type RelationshipKind = 'partner' | 'crush' | 'ex' | 'friend' | 'parent_child' | 'family' | 'colleague';
export type RelationshipSelfRole = 'parent' | 'child';

/** 对方资料只保存在设备；服务端按次排盘，不建立第二个人的账号。 */
export interface RelationshipProfile {
  birth: BirthInput;
  relationship: RelationshipKind;
  selfRole?: RelationshipSelfRole;
}

export interface RelationshipRequest {
  partner?: BirthInput;
  relationship: RelationshipKind;
  /** 明确选择示例时才使用两份固定虚构资料。 */
  example?: boolean;
  selfRole?: RelationshipSelfRole;
}

export interface RelationshipSide {
  palace: PalaceView;
  /** 单宫传统含义的编辑白话，不是对现实人物的判断。 */
  plain: string;
  evidence: PalaceEvidence;
}

export interface RelationshipPalace {
  name: string;
  topic: string;
  left: RelationshipSide;
  right: RelationshipSide;
  commonStars: string[];
  observation: string;
  question: string;
  exercise: string;
}

export interface RelationshipResponse {
  kind: 'example' | 'personal';
  relationship: RelationshipKind;
  left: ChartView;
  right: ChartView;
  topics: { label: string; palace: string }[];
  palaces: RelationshipPalace[];
  method: string;
}

export interface RelationshipAskRequest extends RelationshipRequest {
  palace: string;
  question: string;
  history?: ChatTurn[];
  scope?: 'palace' | 'overall';
}

export interface RelationshipAnswer extends AskResponse {
  notice?: string;
}

export interface RelationshipBasis {
  id: string;
  side: 'left' | 'right';
  palace: string;
  label: string;
  detail: string;
  source?: string;
  kind: 'fact' | 'tradition';
}

export interface RelationshipInsight {
  id: string;
  title: string;
  conclusion: string;
  interaction: string;
  selfAction: string;
  otherAction: string;
  basis: RelationshipBasis[];
}

export interface RelationshipReading {
  id: string;
  version: string;
  mode: 'ai';
  kind: 'example' | 'personal';
  relationship: RelationshipKind;
  selfRole?: RelationshipSelfRole;
  headline: string;
  summary: string;
  sections: RelationshipInsight[];
  followups: string[];
  openQuestions: string[];
  generatedAt: string;
}
