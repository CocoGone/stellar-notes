import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PeerView } from '@shared/api';
import { PeerCard, PeerRow, usePeers } from '@/components/Peers';
import { Skeleton } from '@/components/Skeleton';
import { useApp } from '@/lib/app-state';
import { color, space } from '@/theme';

const LEVELS: [PeerView['level'], string][] = [
  ['same', '命宫位置和主星相同'],
  ['star', '命宫有相同主星'],
  ['shen', '身宫落在同一宫'],
];

export default function Peers() {
  const insets = useSafeAreaInsets();
  const { me } = useApp();
  const chart = me?.chart;
  const { data, error } = usePeers(chart?.id);

  const ask = (p: PeerView) => {
    if (!chart) return;
    const short = p.name.replace(/（.*）/, '').split('·').pop();
    router.push({ pathname: '/chart/ask/[branch]', params: { branch: String(chart.mingBranch), q: `我和${short}的盘面哪里相似，哪里不同？` } });
  };

  return (
    <ScrollView style={{ backgroundColor: color.canvas }} contentContainerStyle={{ padding: space.page, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: '历史同盘' }} />
      <Text style={styles.lead}>从相似之处开始，看见盘面的差异。</Text>
      {data ? <Text style={styles.mine}>你的命宫：{data.ming}</Text> : null}

      <View style={styles.how}>
        <Text style={styles.howTitle} accessibilityRole="header">怎么比的</Text>
        {LEVELS.map(([level, label]) => (
          <Text key={level} style={styles.howItem}>· {label}</Text>
        ))}
        <Text style={styles.howNote}>判断是否有相同主星时，空宫按对宫借来的主星比较。</Text>
        <Text style={styles.howNote}>这些条件只比较部分盘面。各自的人生经历还取决于环境和选择。</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!data && !error ? (
        <View style={{ marginTop: 20 }}>
          <Skeleton lines={4} />
        </View>
      ) : null}

      {data
        ? LEVELS.map(([level, label]) => {
            const list = data.peers.filter((p) => p.level === level);
            if (!list.length) return null;
            const title = level === 'shen' ? `${label}，都在${list[0].diff.replace('身宫和你一样在', '')}` : label;
            return (
              <View key={level} style={{ marginTop: 24, gap: 12 }}>
                <Text style={styles.group}>{title} · {list.length} 位</Text>
                {level === 'shen' ? (
                  <View style={styles.list}>
                    {list.map((p, i) => (
                      <View key={p.name}>
                        {i > 0 ? <View style={styles.sep} /> : null}
                        <PeerRow peer={p} />
                      </View>
                    ))}
                  </View>
                ) : (
                  list.map((p) => <PeerCard key={p.name} peer={p} onAsk={() => ask(p)} />)
                )}
              </View>
            );
          })
        : null}

      {data && data.peers.length === 0 ? <Text style={[styles.howItem, { marginTop: 20 }]}>人物库暂未找到符合上述条件的人。</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lead: { color: color.text, fontSize: 17, lineHeight: 26 },
  mine: { color: color.text, fontSize: 15, marginTop: 6 },
  error: { color: color.danger, fontSize: 15, marginTop: 16 },
  group: { color: color.text2, fontSize: 13 },
  list: { backgroundColor: color.surface, borderRadius: 14, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 60 },
  how: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: color.surface, gap: 5 },
  howTitle: { color: color.text, fontSize: 14, fontWeight: '600' },
  howItem: { color: color.text2, fontSize: 13, lineHeight: 20 },
  howNote: { color: color.text2, fontSize: 12, lineHeight: 18, marginTop: 2 },
});
