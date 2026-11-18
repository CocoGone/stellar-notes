import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PeerView, PeersResponse } from '@shared/api';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { color, font } from '@/theme';

export function usePeers(chartId: string | undefined) {
  // 按盘记结果：换了一张盘，旧结果自然作废
  const [state, setState] = useState<{ id: string; data?: PeersResponse; error?: string } | null>(null);
  useEffect(() => {
    if (!chartId) return;
    let alive = true;
    api
      .peers()
      .then((data) => alive && setState({ id: chartId, data }))
      .catch((err) => alive && setState({ id: chartId, error: (err as Error).message }));
    return () => {
      alive = false;
    };
  }, [chartId]);
  const mine = state && state.id === chartId ? state : null;
  return { data: mine?.data ?? null, error: mine?.error ?? null };
}

export function Seal({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <View style={[styles.seal, small && styles.sealSmall]} accessibilityElementsHidden>
      <Text style={[styles.sealText, small && { fontSize: 16 }]}>{text}</Text>
    </View>
  );
}

/** 命盘页上的「历史同盘」一块：放第一位人物，下面"还有 N 位"。 */
export function PeerSection({ chartId }: { chartId: string }) {
  const { data } = usePeers(chartId);
  const first = data?.peers[0];
  if (!data || !first) return null;
  const open = () => router.push('/chart/peers');
  return (
    <View style={{ marginTop: 28, gap: 6 }}>
      <Text style={styles.sectionTitle} accessibilityRole="header">历史同盘</Text>
      <Text style={styles.caption}>看看你和历史人物的盘面哪里相似，哪里不同。</Text>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${first.name}，${first.diff}，查看全部`} style={({ pressed }) => [styles.entry, pressed && { backgroundColor: color.surface2 }]}>
        <Seal text={first.seal} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.name}>{first.name}</Text>
          <Text style={styles.meta}>{first.years} · {first.who}</Text>
          <Text style={styles.entryDiff}>{first.level === 'same' ? `命宫同在${first.ming.replace(' · ', '：')}` : first.diff}</Text>
        </View>
        <Icon name="chevron.right" size={13} />
      </Pressable>
      {data.peers.length > 1 ? (
        <Pressable onPress={open} accessibilityRole="button" hitSlop={8} style={{ paddingVertical: 6 }}>
          <Text style={styles.more}>还有 {data.peers.length - 1} 位 · 看全部</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 列表页的完整卡片（命宫完全一样、命宫有相同主星两档用） */
export function PeerCard({ peer, onAsk }: { peer: PeerView; onAsk: () => void }) {
  const rows: [string, string][] = [
    ['出生', peer.born],
    ['出处', peer.src],
    ['命宫', peer.ming],
    ['和你', peer.diff],
  ];
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Seal text={peer.seal} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.name}>{peer.name}</Text>
          <Text style={styles.meta}>{peer.years} · {peer.who}</Text>
        </View>
      </View>
      <View style={{ gap: 6, marginTop: 14 }}>
        {rows.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={styles.dt}>{k}</Text>
            <Text style={styles.dd}>{v}</Text>
          </View>
        ))}
      </View>
      {peer.story ? <Text style={styles.story}>{peer.story}</Text> : null}
      {peer.ref ? (
        <View style={styles.ref}>
          <Text style={styles.refLabel}>古籍参考</Text>
          <Text style={styles.refText}>{peer.ref.text}</Text>
          <Text style={styles.refSource}>——{peer.ref.source.replace('《紫微斗数全书》', '').trim()}</Text>
        </View>
      ) : null}
      <Pressable onPress={onAsk} accessibilityRole="button" hitSlop={6} style={styles.askBtn}>
        <Icon name="bubble.left" size={13} tint={color.accent} />
        <Text style={styles.askText}>问 AI：我们哪里相似，哪里不同？</Text>
      </Pressable>
    </View>
  );
}

/** 身宫一样的那一档：一行一位 */
export function PeerRow({ peer }: { peer: PeerView }) {
  return (
    <View style={styles.row} accessibilityLabel={`${peer.name}，${peer.years}，${peer.who}，命宫${peer.ming}`}>
      <Seal text={peer.seal} small />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowName}>{peer.name}</Text>
        <Text style={styles.meta}>{peer.years} · {peer.who}</Text>
        <Text style={styles.meta}>命宫 {peer.ming} · {peer.src}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: color.text, fontSize: 20, fontWeight: '600' },
  caption: { color: color.text2, fontSize: 13, lineHeight: 19 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, backgroundColor: color.surface, borderRadius: 18, padding: 16 },
  entryDiff: { color: color.text, fontSize: 15, marginTop: 3 },
  more: { color: color.accent, fontSize: 15, fontWeight: '600' },
  seal: { width: 40, height: 40, borderWidth: 1.5, borderColor: color.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  sealSmall: { width: 32, height: 32 },
  sealText: { color: color.text, fontFamily: font.serif, fontSize: 20 },
  name: { color: color.text, fontSize: 17, fontWeight: '600' },
  meta: { color: color.text2, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: color.surface, borderRadius: 18, padding: 18 },
  dt: { width: 30, color: color.text2, fontSize: 13, lineHeight: 19 },
  dd: { flex: 1, color: color.text, fontSize: 13, lineHeight: 19 },
  story: { color: color.text, fontSize: 15, lineHeight: 25, marginTop: 14 },
  ref: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator, gap: 4 },
  refLabel: { color: color.text2, fontSize: 12 },
  refText: { color: color.text, fontFamily: font.serif, fontSize: 17, lineHeight: 28 },
  refSource: { color: color.text2, fontSize: 12, textAlign: 'right' },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, marginTop: 8 },
  askText: { color: color.accent, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowName: { color: color.text, fontSize: 16, fontWeight: '500' },
});
