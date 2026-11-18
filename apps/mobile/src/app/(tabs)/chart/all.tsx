import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChartReadingResponse } from '@shared/api';
import { Badge } from '@/components/Badge';
import { TextButton } from '@/components/Buttons';
import { ClassicRefs } from '@/components/ClassicRefs';
import { Disclosure } from '@/components/Disclosure';
import { Skeleton } from '@/components/Skeleton';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, font, space } from '@/theme';

/** 全盘解读：12 宫一起写好，从命宫往下读。还在写的宫先显示规则版，隔几秒再取一次。 */
export default function AllReadings() {
  const insets = useSafeAreaInsets();
  const { me } = useApp();
  const chartId = me?.chart.id;
  const [state, setState] = useState<{ id: string; data?: ChartReadingResponse; error?: string } | null>(null);

  useEffect(() => {
    if (!chartId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      api
        .readings()
        .then((data) => {
          if (!alive) return;
          setState({ id: chartId, data });
          if (data.items.some((i) => i.status === 'writing')) timer = setTimeout(load, 4000);
        })
        .catch((err) => alive && setState({ id: chartId, error: (err as Error).message }));
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [chartId]);

  const mine = state && state.id === chartId ? state : null;
  const data = mine?.data;
  const chart = me?.chart;
  const done = data?.items.filter((i) => i.status === 'ready').length ?? 0;

  return (
    <ScrollView style={{ backgroundColor: color.canvas }} contentContainerStyle={{ padding: space.page, paddingBottom: insets.bottom + 40 }}>
      <Stack.Screen options={{ title: '全盘解读' }} />
      <Text style={styles.lead}>{chart?.kind === 'sample' ? '这张示例盘' : '你的盘'}的 12 个宫，从命宫往下读。</Text>
      {data && done < 12 ? <Text style={styles.progress}>已写好 {done}/12，其余几宫正在写，写好会自动换上。</Text> : null}
      {mine?.error ? <Text style={styles.error}>{mine.error}</Text> : null}
      {!data && !mine?.error ? (
        <View style={{ marginTop: 20 }}>
          <Skeleton lines={6} />
        </View>
      ) : null}

      {data?.items.map(({ branch, status, reading }, idx) => {
        const palace = chart?.palaces[branch];
        if (!palace) return null;
        return (
          <View key={branch} style={[styles.section, idx > 0 && styles.sectionBorder]}>
            <View style={styles.head}>
              <Text style={styles.palace}>{palace.name}</Text>
              <Text style={styles.topic}>{palace.topic}</Text>
              <View style={{ flex: 1 }} />
              {status === 'writing' ? <Badge label="正在写" tone="gold" /> : null}
            </View>
            <Text style={styles.headline}>{reading.headline}</Text>
            <Text style={styles.body}>{reading.plain}</Text>
            <View style={{ marginTop: 12 }}>
              <Disclosure title="为什么这样说">
                <View style={{ gap: 12, paddingBottom: 6 }}>
                  {reading.steps.map((s, i) => (
                    <View key={s.title} style={{ gap: 3 }}>
                      <Text style={styles.stepTitle}>{i + 1}. {s.title}</Text>
                      <Text style={styles.stepBody}>{s.body}</Text>
                    </View>
                  ))}
                </View>
              </Disclosure>
            </View>
            <View style={{ marginTop: 12 }}>
              <ClassicRefs refs={reading.evidence.classics ?? []} note={reading.evidence.classicsNote} />
            </View>
            <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <TextButton label={`继续问${palace.name}`} onPress={() => router.push(`/chart/ask/${branch}`)} />
            </View>
          </View>
        );
      })}

      {data ? <Text style={styles.disclaimer}>传统解释是一种观察角度，不是人生定论。</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lead: { color: color.text, fontSize: 17, lineHeight: 26 },
  progress: { color: color.gold, fontSize: 13, lineHeight: 19, marginTop: 6 },
  error: { color: color.danger, fontSize: 15, marginTop: 16 },
  section: { paddingVertical: 24 },
  sectionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  palace: { color: color.text, fontSize: 20, fontWeight: '600' },
  topic: { color: color.text2, fontSize: 13 },
  headline: { color: color.text, fontFamily: font.serif, fontSize: 21, lineHeight: 31, marginTop: 10 },
  body: { color: color.text, fontSize: 16, lineHeight: 27, marginTop: 10 },
  stepTitle: { color: color.text, fontSize: 15, fontWeight: '600' },
  stepBody: { color: color.text2, fontSize: 15, lineHeight: 24 },
  disclaimer: { color: color.text2, fontSize: 12, marginTop: 8 },
});
