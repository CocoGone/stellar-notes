import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RelationshipReading, RelationshipRequest, RelationshipResponse } from '@shared/api';
import { api } from '@/lib/api';
import { cachedRelationshipReading, cacheRelationshipReading, relationshipReadingKey } from '@/lib/relationship-reading';
import { color, font } from '@/theme';
import { PrimaryButton, TextButton } from './Buttons';
import { Disclosure } from './Disclosure';
import { RelationshipQuestions } from './Relationship';
import { Skeleton } from './Skeleton';

export function RelationshipReadingPanel({ comparison, request }: { comparison: RelationshipResponse; request: RelationshipRequest }) {
  const cacheKey = relationshipReadingKey(comparison, request);
  const [reading, setReading] = useState<RelationshipReading | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    cachedRelationshipReading(cacheKey).catch(() => null)
      .then(async (cached) => {
        if (abort.signal.aborted) return;
        const next = cached ?? await api.relationshipReading(request, abort.signal);
        if (!abort.signal.aborted) {
          setReading(next);
          if (!cached) void cacheRelationshipReading(cacheKey, next).catch(() => undefined);
        }
      })
      .catch((err) => { if (!abort.signal.aborted) setError((err as Error).message); })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => { abort.abort(); controller.current?.abort(); };
  }, [cacheKey, request]);

  async function regenerate() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError(null);
    try {
      const next = await api.relationshipReading({ ...request, refresh: true }, abort.signal);
      if (!abort.signal.aborted) {
        setReading(next);
        void cacheRelationshipReading(cacheKey, next).catch(() => undefined);
      }
    } catch (err) { if (!abort.signal.aborted) setError((err as Error).message); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }

  return <View style={styles.wrap}>
    <View style={styles.heading}>
      <Text style={styles.title} accessibilityRole="header">合盘解读</Text>
      <Text style={styles.label}>{comparison.kind === 'example' ? '示例 · 双人综合解读' : '双人综合解读'}</Text>
    </View>
    {!reading && busy ? <View style={styles.loading} accessibilityLiveRegion="polite">
      <Text style={styles.loadingTitle}>正在读你们的关系</Text>
      <Text style={styles.loadingText}>把双方盘面放在一起，整理互补、摩擦与相处重点。</Text>
      <Skeleton lines={5} />
    </View> : null}
    {error ? <View style={styles.errorBox} accessibilityLiveRegion="polite"><Text style={styles.error}>{error}</Text>{!reading ? <PrimaryButton label="重新生成合盘解读" onPress={regenerate} loading={busy} /> : null}</View> : null}
    {reading ? <>
      <View style={styles.summary}>
        <Text style={styles.headline}>{reading.headline}</Text>
        <Text style={styles.body}>{reading.summary}</Text>
      </View>
      {reading.sections.map((section, i) => <View key={section.id} style={styles.section}>
        <View style={styles.sectionHead}><Text style={styles.number}>{String(i + 1).padStart(2, '0')}</Text><Text style={styles.sectionTitle}>{section.title}</Text></View>
        <Text style={styles.conclusion}>{section.conclusion}</Text>
        <Text style={styles.body}>{section.interaction}</Text>
        <View style={styles.action}><Text style={[styles.actionLabel, { color: color.accent }]}>我方怎么做</Text><Text style={styles.actionText}>{section.selfAction}</Text></View>
        <View style={styles.action}><Text style={[styles.actionLabel, { color: color.gold }]}>对方怎么做</Text><Text style={styles.actionText}>{section.otherAction}</Text></View>
        <View style={styles.basis}>
          <Disclosure title="这条判断的依据">
            {section.basis.map((b) => <View key={b.id} style={styles.basisItem}>
              <Text style={[styles.basisLabel, { color: b.side === 'left' ? color.accent : color.gold }]}>{b.side === 'left' ? '我方' : '对方'} · {b.palace} · {b.kind === 'fact' ? '盘面事实' : '传统含义'}</Text>
              <Text style={styles.basisTitle}>{b.label}</Text>
              <Text style={styles.basisText}>{b.detail}</Text>
              {b.source ? <Text style={styles.source}>{b.source}</Text> : null}
            </View>)}
          </Disclosure>
        </View>
      </View>)}
      {reading.openQuestions.length ? <View style={styles.openQuestions}>
        <Text style={styles.openTitle}>还需要问你们</Text>
        {reading.openQuestions.map((q, i) => <Text key={i} style={styles.openText}>{i + 1}. {q}</Text>)}
      </View> : null}
      <View style={styles.footer}><Text style={styles.source}>依据两张本命盘作传统视角的综合解读。</Text><TextButton label={busy ? '正在更新…' : '重新生成'} onPress={regenerate} disabled={busy} /></View>
      <RelationshipQuestions request={request} pair={comparison.palaces[0]} scope="overall" suggestions={reading.followups} />
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 18, marginTop: 4, marginBottom: 28 },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  title: { color: color.text, fontFamily: font.serif, fontSize: 26 },
  label: { color: color.text2, fontSize: 12 },
  loading: { backgroundColor: color.surface, padding: 18, borderRadius: 16, gap: 16 },
  loadingTitle: { color: color.text, fontSize: 18 },
  loadingText: { color: color.text2, fontSize: 14, lineHeight: 24 },
  summary: { borderLeftWidth: 2, borderLeftColor: color.gold, paddingLeft: 18, paddingVertical: 4, gap: 14 },
  headline: { color: color.text, fontFamily: font.serif, fontSize: 25, lineHeight: 39 },
  body: { color: color.text, fontSize: 15, lineHeight: 28 },
  section: { backgroundColor: color.surface, padding: 18, borderRadius: 16, gap: 15 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { color: color.gold, fontSize: 12, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  sectionTitle: { color: color.text2, fontSize: 14, fontWeight: '500' },
  conclusion: { color: color.text, fontFamily: font.serif, fontSize: 22, lineHeight: 35 },
  action: { gap: 5, paddingTop: 7 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  actionText: { color: color.text2, fontSize: 14, lineHeight: 25 },
  basis: { marginTop: 2, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  basisItem: { gap: 5, marginVertical: 10 },
  basisLabel: { fontSize: 12, fontWeight: '500' },
  basisTitle: { color: color.text, fontSize: 13, fontWeight: '500' },
  basisText: { color: color.text2, fontSize: 13, lineHeight: 23 },
  source: { color: color.text2, fontSize: 11, lineHeight: 18, flexShrink: 1 },
  openQuestions: { paddingHorizontal: 2, gap: 8 },
  openTitle: { color: color.text, fontSize: 16, fontWeight: '500', marginBottom: 3 },
  openText: { color: color.text2, fontSize: 14, lineHeight: 25 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  errorBox: { backgroundColor: color.surface, borderRadius: 14, padding: 16, gap: 14 },
  error: { color: color.danger, fontSize: 14, lineHeight: 24 },
});
