import type { DailyReading } from '@shared/api';

/** 「先看看示例」用的固定解读：示例盘 + 2026-10-30（丁丑日），日干四化由引擎算出 */
export const SAMPLE_DAILY: DailyReading = {
  mode: 'rules',
  chartId: 'sample',
  chartKind: 'sample',
  day: {
    date: '2026-10-30',
    weekday: '星期五',
    lunarLabel: '九月廿一',
    dayGanZhi: '丁丑日',
    transforms: [
      { siHua: '禄', star: '太阴', palaceName: '命宫', palaceBranch: 1, topic: '自我与性格' },
      { siHua: '权', star: '天同', palaceName: '夫妻宫', palaceBranch: 11, topic: '亲密关系与伴侣' },
      { siHua: '科', star: '天机', palaceName: '福德宫', palaceBranch: 3, topic: '内心与精神生活' },
      { siHua: '忌', star: '巨门', palaceName: '福德宫', palaceBranch: 3, topic: '内心与精神生活' },
    ],
  },
  title: '给今天，留一点余地。',
  photoTitle: '一段山路，一束光',
  seen: '示例里是一段山路和一束日光，路往远处转弯，光落在近处。先停一停，看看你注意到的是路，还是光。',
  chartAngle: '这一天太阴化禄落在示例盘的命宫，传统上是顺心、愿意照顾自己感受的提示；巨门化忌落在福德宫，心里容易反复琢磨。也问问自己：今天照顾到自己了吗？',
  smallThing: '写下一句：今天，什么让你松了一口气？留住具体的感受，明天再回来看。',
  basis: [
    '丁丑日，太阴化禄，落在命宫（自我与性格）',
    '丁丑日，天同化权，落在夫妻宫（亲密关系与伴侣）',
    '丁丑日，天机化科，落在福德宫（内心与精神生活）',
    '丁丑日，巨门化忌，落在福德宫（内心与精神生活）',
  ],
  caution: '固定示例，展示“照片 + 命盘”的解读方式，不是你的结论。',
};
