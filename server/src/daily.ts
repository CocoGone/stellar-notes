// 当日盘面：日干四化落在本命盘的哪些宫；以及不调用大模型时的规则版今日解读。

import { Solar } from 'lunar-javascript';
import type { ChartView, DailyReading, DayContext, SiHua } from '../../shared/api.ts';
import { getLiuRiSiHua } from './engine/ziwei/sihua';
import { lunarLabel } from './chart.ts';
import { PALACE_FRAMES, SIHUA_PLAIN } from './knowledge.ts';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const ORDER: SiHua[] = ['禄', '权', '科', '忌'];

export function parseDate(date: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error('date must be YYYY-MM-DD');
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function dayContext(chart: ChartView, date: string): DayContext {
  const { year, month, day } = parseDate(date);
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const lm = lunar.getMonth();
  const liuRi = getLiuRiSiHua(lunar.getYear(), Math.abs(lm), lunar.getDay(), lm < 0);
  const transforms = liuRi
    ? ORDER.map((siHua) => {
        const star = liuRi.transforms[siHua];
        const palace = chart.palaces.find((p) => [...p.majorStars, ...p.otherStars].some((s) => s.name === star));
        return {
          siHua,
          star,
          palaceName: palace?.name ?? '',
          palaceBranch: palace?.branch ?? -1,
          topic: palace?.topic ?? '',
        };
      }).filter((t) => t.palaceBranch >= 0)
    : [];
  return {
    date,
    weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
    lunarLabel: lunarLabel(lm, lunar.getDay(), lm < 0),
    dayGanZhi: `${lunar.getDayGan()}${lunar.getDayZhi()}日`,
    transforms,
  };
}

export function dayBasis(ctx: DayContext): string[] {
  return ctx.transforms.map((t) => `${ctx.dayGanZhi}，${t.star}化${t.siHua}，落在你的${t.palaceName}（${t.topic}）`);
}

export function rulesDaily(chart: ChartView, ctx: DayContext, note: string | undefined, hasImage: boolean): DailyReading {
  const lu = ctx.transforms.find((t) => t.siHua === '禄');
  const ji = ctx.transforms.find((t) => t.siHua === '忌');
  const jiFrame = ji ? PALACE_FRAMES[ji.palaceName] : undefined;

  return {
    mode: 'rules',
    chartId: chart.id,
    chartKind: chart.kind,
    day: ctx,
    title: lu ? `今天，${lu.topic}这件事可以多放点心思。` : '给今天，留一点余地。',
    photoTitle: note?.trim() ? note.trim().slice(0, 16) : '今天的一张图',
    seen: hasImage
      ? '还没有接入识图服务，这次不分析照片里的内容。照片只留在你的手机上。'
      : '这次没有附照片。',
    chartAngle: ctx.transforms.length
      ? ctx.transforms
          .map((t) => `${t.star}化${t.siHua}落在${t.palaceName}——${SIHUA_PLAIN[t.siHua].split('：')[1]}`)
          .join('；') + '。这是一种看今天的角度，不是预言。'
      : '这一天的日干四化没有落在本命盘的星曜上。',
    smallThing: jiFrame?.smallThing ?? '写下一句：今天，什么让你松了一口气？',
    basis: dayBasis(ctx),
    caution: chart.kind === 'sample' ? '用的是示例命盘。补充出生资料后，会换成你自己的盘。' : undefined,
  };
}
