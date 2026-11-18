import type { RelationshipKind } from './api.ts';

export const RELATIONSHIPS = ['partner', 'crush', 'ex', 'friend', 'parent_child', 'family', 'colleague'] as const;
export const RELATIONSHIP_READING_VERSION = 'relationship-insights-1';
export const RELATIONSHIP_LABEL: Record<RelationshipKind, string> = {
  partner: '伴侣', crush: '暧昧 / 互有好感', ex: '分开 / 断联', friend: '朋友', parent_child: '亲子', family: '家人', colleague: '合作搭档',
};

export const FRIENDSHIP_GOALS = [
  {
    id: 'repair', label: '想试着修复', detail: '从一句开场白开始',
    prompt: '我想试着修复这段友情。请结合双方的相处差异，帮我想一句开场白，并说明我能做什么、哪些事要先问对方。',
  },
  {
    id: 'distance', label: '想拉开距离', detail: '把联系和边界说清楚',
    prompt: '我想先拉开距离。请结合双方的相处差异，帮我把联系边界说清楚，不预设我们必须和好。',
  },
] as const;
