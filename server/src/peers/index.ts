// 历史同盘：拿用户的命宫、身宫和人物库比，分三档——命宫完全一样、命宫有相同主星、身宫在同一宫。

import type { ChartView, PeerView, PeersResponse } from '../../../shared/api.ts';
import { PEOPLE, type Person } from './people.ts';
import { STORIES } from './stories.ts';

const MAX_STAR = 6;
const MAX_SHEN = 6;

type StarLike = { name: string; brightness?: string; siHua?: string };

function starsText(stars: StarLike[]): string {
  return stars.length ? stars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.siHua ? `·化${s.siHua}` : ''}`).join('、') : '空宫';
}

function siHuaText(stars: StarLike[]): string {
  const h = stars.filter((s) => s.siHua).map((s) => `${s.name}化${s.siHua}`);
  return h.length ? h.join('、') : '没有生年四化';
}

export function historicalPeers(chart: ChartView): PeersResponse {
  const ming = chart.palaces[chart.mingBranch];
  const shenName = chart.palaces[chart.shenBranch].name;
  const own: StarLike[] = ming.majorStars;
  // 命宫是空宫时，"有相同主星"按借来的星比
  const compare = own.length ? own.map((s) => s.name) : (ming.borrowed?.stars ?? []);
  const sameSet = (p: Person) =>
    p.ming.branch === ming.branchName && p.ming.stars.length === own.length && own.every((s) => p.ming.stars.some((x) => x.name === s.name));

  const view = (p: Person, level: PeerView['level'], diff: string): PeerView => ({
    level,
    name: p.name,
    seal: p.seal,
    years: p.years,
    who: p.who,
    born: p.born,
    src: p.src,
    ming: `${p.ming.branch}宫 · ${starsText(p.ming.stars)}`,
    shen: p.shen,
    diff,
    ...(STORIES[p.name] ?? {}),
  });

  const same: PeerView[] = [];
  const star: { v: PeerView; n: number }[] = [];
  const shen: PeerView[] = [];
  for (const p of PEOPLE) {
    if (sameSet(p)) {
      const parts = ['命宫的位置和主星和你一样'];
      const mine = siHuaText(own);
      const theirs = siHuaText(p.ming.stars);
      if (mine !== theirs) parts.push(`四化不同（你是${mine}，他是${theirs}）`);
      parts.push(p.shen === shenName ? `身宫也和你一样在${shenName}` : `身宫不同（他在${p.shen}，你在${shenName}）`);
      same.push(view(p, 'same', parts.join('；')));
      continue;
    }
    const shared = p.ming.stars.filter((s) => compare.includes(s.name));
    if (shared.length) {
      const alsoHua = shared.filter((s) => s.siHua && own.some((o) => o.name === s.name && o.siHua === s.siHua));
      const diff = `命宫里也有${shared.map((s) => s.name).join('、')}${alsoHua.length ? `，而且和你一样${alsoHua.map((s) => `${s.name}化${s.siHua}`).join('、')}` : ''}`;
      star.push({ v: view(p, 'star', diff), n: shared.length * 2 + alsoHua.length + (STORIES[p.name] ? 1 : 0) });
      continue;
    }
    if (p.shen === shenName) shen.push(view(p, 'shen', `身宫和你一样在${shenName}`));
  }
  star.sort((a, b) => b.n - a.n);
  return {
    ming: `${ming.branchName}宫 · ${starsText(own)}${own.length ? '' : `（借${ming.borrowed?.fromName ?? '对宫'}的${compare.join('、')}）`}`,
    peers: [...same, ...star.slice(0, MAX_STAR).map((x) => x.v), ...shen.slice(0, MAX_SHEN)],
  };
}
