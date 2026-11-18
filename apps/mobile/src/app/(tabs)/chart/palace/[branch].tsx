import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PalaceReading } from '@shared/api';
import { Badge } from '@/components/Badge';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { ClassicRefs } from '@/components/ClassicRefs';
import { Disclosure } from '@/components/Disclosure';
import { PatternCards } from '@/components/PatternCards';
import { Skeleton } from '@/components/Skeleton';
import { WaitStatus } from '@/components/WaitStatus';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, font, space } from '@/theme';

export default function PalaceDetail() {
  const { branch: raw } = useLocalSearchParams<{ branch: string }>();
  const branch = Number(raw);
  const insets = useSafeAreaInsets();
  const { me, setSelected } = useApp();
  const chart = me?.chart;
  const palace = chart?.palaces[branch];
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; reading?: PalaceReading; error?: string } | null>(null);
  const [preview, setPreview] = useState<{ key: string; reading: PalaceReading } | null>(null);
  const [started, setStarted] = useState<{ key: string; at: number } | null>(null);
  // 命盘换了（比如改了出生资料）或点了重试，就重新取解读
  const key = `${chart?.id}:${branch}:${attempt}`;

  useEffect(() => {
    let alive = true;
    const at = Date.now();
    // 规则版依据立即返回，先给用户看；大模型白话解读随后到
    api.preview(branch).then((r) => alive && setPreview({ key, reading: r })).catch(() => {});
    api
      .reading(branch)
      .then((reading) => alive && setResult({ key, reading }))
      .catch((err) => alive && setResult({ key, error: (err as Error).message }));
    Promise.resolve().then(() => alive && setStarted({ key, at }));
    return () => {
      alive = false;
    };
  }, [key, branch]);

  const reading = result?.key === key ? result.reading ?? null : null;
  const error = result?.key === key ? result.error ?? null : null;
  const early = preview?.key === key ? preview.reading : null;
  const startedAt = started?.key === key ? started.at : undefined;
  const load = () => setAttempt((a) => a + 1);

  if (!chart || !palace) return null;

  const starLine = palace.majorStars.length
    ? `主星 ${palace.majorStars.map((s) => s.name).join('、')}`
    : `无主星 · 借${palace.borrowed?.fromName ?? '对宫'}`;
  const sourced = reading?.evidence.tradition.filter((t) => t.source) ?? [];
  // 旧后端的解读里未带条件时，沿用命盘总览中同一格局的已知条件。
  const patterns = (reading?.evidence.patterns ?? []).map((pattern) => ({
    ...chart.patterns.find((item) => item.name === pattern.name),
    ...pattern,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: palace.name, headerBackTitle: '命盘' }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 120 }}>
        <Badge label={`${chart.kind === 'sample' ? '示例盘' : '我的盘'} · ${reading ? (reading.mode === 'ai' ? 'AI 解读' : '规则解读') : '解读中'}`} />

        {reading ? (
          <Text style={styles.headline} accessibilityRole="header">{reading.headline}</Text>
        ) : (
          <View style={{ marginVertical: 18 }}>
            <Skeleton lines={2} widths={['88%', '60%']} />
          </View>
        )}
        <Text style={styles.meta}>{starLine} · {palace.topic}</Text>
        <View style={styles.rule} />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.body}>{error}</Text>
            <TextButton label="重试" onPress={load} />
          </View>
        ) : !reading ? (
          <View style={{ gap: 16 }}>
            <WaitStatus
              startedAt={startedAt}
              typical={me?.ai.enabled ? '第一次打开这一宫通常 15–30 秒，之后会直接显示' : '马上就好'}
              steps={[
                { label: '整理盘面依据', state: early ? 'done' : 'active', detail: early ? `${early.evidence.facts.length + early.evidence.tradition.length} 条` : undefined },
                { label: '写白话解释', state: early ? 'active' : 'pending' },
              ]}
            />
            {early ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.section}>已经找到的盘面依据</Text>
                {early.evidence.facts.map((f) => (
                  <Text key={f.label} style={styles.stepBody}>· {f.detail}</Text>
                ))}
                {early.evidence.related.map((r) => (
                  <Text key={r.branch} style={styles.stepBody}>· {r.relation}{r.name}：{r.stars.join('、') || '空宫'}</Text>
                ))}
              </View>
            ) : (
              <Skeleton lines={3} widths={['100%', '90%', '70%']} />
            )}
          </View>
        ) : (
          <>
            <Text style={styles.section}>先用白话说</Text>
            <Text style={styles.body}>{reading.plain}</Text>

            <View style={{ marginTop: 22 }}>
              <Disclosure title="为什么这样说" initiallyOpen>
                <View style={styles.steps}>
                  {reading.steps.map((s, i) => (
                    <View key={s.title} style={[styles.step, i > 0 && styles.stepBorder]}>
                      <View style={styles.num}>
                        <Text style={styles.numText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.stepTitle}>{s.title}</Text>
                        <Text style={styles.stepBody}>{s.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Disclosure>
            </View>

            {reading.evidence.related.length ? (
              <View style={{ marginTop: 18 }}>
                <Text style={styles.section}>相关宫位</Text>
                <View style={styles.relatedRow}>
                  {reading.evidence.related.map((r) => (
                    <Pressable
                      key={r.branch}
                      accessibilityRole="button"
                      accessibilityLabel={`${r.relation}${r.name}，${r.topic}，查看解读`}
                      onPress={() => {
                        setSelected(r.branch);
                        router.push(`/chart/palace/${r.branch}`);
                      }}
                      style={({ pressed }) => [styles.related, pressed && { backgroundColor: color.related }]}
                    >
                      <Text style={styles.relatedKind}>{r.relation}</Text>
                      <Text style={styles.relatedName}>{r.name}</Text>
                      <Text style={styles.relatedStars} numberOfLines={1}>{r.stars.join('、') || '空宫'}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {patterns.length ? (
              <View style={{ marginTop: 24, marginBottom: 6 }}>
                <PatternCards key={`${chart.id}:${branch}`} patterns={patterns} />
              </View>
            ) : null}

            <Text style={[styles.section, { marginTop: 18 }]}>问问自己</Text>
            {reading.reflect.map((q) => (
              <Text key={q} style={styles.reflect}>· {q}</Text>
            ))}

            <View style={{ marginTop: 18 }}>
              <Disclosure title="依据与出处">
                <View style={{ gap: 12, paddingBottom: 6 }}>
                  {sourced.map((t, i) => (
                    <View key={`${t.label}-${i}`} style={{ gap: 3 }}>
                      <Text style={styles.stepTitle}>{t.label}</Text>
                      <Text style={styles.stepBody}>{t.detail}</Text>
                      <Text style={styles.source}>出处：{t.source}</Text>
                    </View>
                  ))}
                </View>
              </Disclosure>
            </View>

            {/* 旧版缓存里没有 classics，按空列表处理 */}
            <View style={{ marginTop: 18 }}>
              <ClassicRefs refs={reading.evidence.classics ?? []} note={reading.evidence.classicsNote} />
            </View>

            <Text style={styles.disclaimer}>传统解释是一种观察角度，不是人生定论。</Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton label="继续问一问" arrow disabled={!reading} onPress={() => router.push(`/chart/ask/${branch}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { color: color.text, fontFamily: font.serif, fontSize: 28, lineHeight: 40, marginTop: 14, marginBottom: 8 },
  meta: { color: color.text2, fontSize: 14 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginVertical: 18 },
  section: { color: color.text, fontSize: 17, fontWeight: '600', marginBottom: 8 },
  body: { color: color.text, fontSize: 16, lineHeight: 28 },
  steps: { backgroundColor: color.surface, borderRadius: 16, paddingHorizontal: 14, marginTop: 4 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  stepBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.related, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { color: color.accent, fontSize: 12, fontWeight: '600' },
  stepTitle: { color: color.text, fontSize: 15, fontWeight: '600' },
  stepBody: { color: color.text2, fontSize: 14, lineHeight: 23 },
  source: { color: color.border, fontSize: 12 },
  relatedRow: { flexDirection: 'row', gap: 8 },
  related: { flex: 1, backgroundColor: color.surface, borderRadius: 12, padding: 10, gap: 2, minHeight: 44 },
  relatedKind: { color: color.accent, fontSize: 11 },
  relatedName: { color: color.text, fontSize: 15, fontWeight: '500' },
  relatedStars: { color: color.text2, fontSize: 12 },
  reflect: { color: color.text, fontSize: 15, lineHeight: 25 },
  disclaimer: { color: color.text2, fontSize: 12, marginTop: 22 },
  errorBox: { backgroundColor: color.surface, borderRadius: 14, padding: 16, gap: 8, alignItems: 'flex-start' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.page, paddingTop: 12, backgroundColor: color.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
});
