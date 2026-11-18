import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AskHistoryResponse, RecordItem } from '@shared/api';
import { AskRow, askRowSeparator } from '@/components/AskRow';
import { TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { PhotoThumbArt } from '@/components/PhotoArt';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { resetDeviceId } from '@/lib/device';
import { dateLabel } from '@/lib/format';
import { color, space } from '@/theme';

export default function MeHome() {
  const insets = useSafeAreaInsets();
  const { me, refreshMe, setDaily, setPhoto, setNote, savePartner } = useApp();
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asks, setAsks] = useState<AskHistoryResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  // 每次回到这一页都重新取一次，今日页保存或详情页删除后列表即更新
  useFocusEffect(
    useCallback(() => {
      api.records().then(setRecords).catch((err) => setError((err as Error).message));
      api.asks().then(setAsks).catch((err) => setAskError((err as Error).message));
    }, []),
  );

  const birth = me?.birth;
  const birthLine = !birth
    ? '还没有填写，现在用的是示例盘'
    : me?.pending
      ? `已保存，${birth.time.status === 'unknown' ? '出生时间待补充' : '出生时间待核实'}`
      : me?.chart.summary;

  function deleteAll() {
    Alert.alert('删除全部数据？', '出生资料、命盘、追问记录和今日记录都会从服务器删除，本机的合盘资料也会移除，不能恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await savePartner(null);
            await api.deleteMe();
            await resetDeviceId();
            setDaily(null);
            setPhoto(null);
            setNote('');
            setRecords([]);
            setAsks({ items: [] });
            await refreshMe();
          } catch (err) {
            setError((err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: color.canvas }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: space.page, paddingBottom: 40 }}>
      <Text style={styles.title} accessibilityRole="header">我的</Text>

      <Text style={styles.section}>出生资料</Text>
      <Pressable onPress={() => router.push('/birth')} accessibilityRole="button" style={({ pressed }) => [styles.card, styles.rowCard, pressed && { backgroundColor: color.surface2 }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.cardTitle}>{birth ? birth.nickname || '本命' : '填写出生资料'}</Text>
          <Text style={styles.cardSub}>{birthLine}</Text>
        </View>
        <Icon name="chevron.right" size={13} />
      </Pressable>

      <Text style={styles.section}>今日记录</Text>
      <View style={styles.card}>
        {records === null && !error ? (
          <ActivityIndicator color={color.accent} style={{ padding: 20 }} />
        ) : records?.length ? (
          records.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <View style={styles.sep} /> : null}
              <Pressable onPress={() => router.push(`/me/record/${r.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.record, pressed && { backgroundColor: color.surface2 }]}>
                {r.thumb ? <Image source={{ uri: r.thumb }} style={styles.thumb} /> : <PhotoThumbArt size={48} />}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.recordTitle} numberOfLines={1}>{r.reading.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{dateLabel(r.date)}{r.note ? ` · ${r.note}` : ''}</Text>
                </View>
                <Icon name="chevron.right" size={12} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{error ?? '还没有保存的记录。去「今日」选一张照片试试。'}</Text>
        )}
      </View>

      <Text style={styles.section}>问答记录</Text>
      <View style={styles.card}>
        {asks === null && !askError ? (
          <ActivityIndicator color={color.accent} style={{ padding: 20 }} />
        ) : asks?.items.length ? (
          <>
            {asks.items.slice(0, 5).map((a, i) => (
              <View key={a.id}>
                {i > 0 ? <View style={askRowSeparator} /> : null}
                <AskRow item={a} />
              </View>
            ))}
            {asks.items.length > 5 || asks.next ? (
              <>
                <View style={askRowSeparator} />
                <Pressable onPress={() => router.push('/me/asks')} accessibilityRole="button" style={({ pressed }) => [styles.rowCard, { minHeight: 48, paddingVertical: 12 }, pressed && { backgroundColor: color.surface2 }]}>
                  <Text style={[styles.cardSub, { flex: 1, color: color.accent }]}>全部问答</Text>
                  <Icon name="chevron.right" size={12} />
                </Pressable>
              </>
            ) : null}
          </>
        ) : (
          <Text style={styles.emptyText}>{askError ?? '还没有问过。在命盘里点开一个宫，就能接着追问。'}</Text>
        )}
      </View>

      <Text style={styles.section}>解读服务</Text>
      <View style={[styles.card, { padding: 16, gap: 6 }]}>
        <Text style={styles.cardTitle}>{me?.ai.enabled ? '大模型解读已开启' : '大模型解读未配置'}</Text>
        <Text style={styles.cardSub}>
          {me?.ai.enabled
            ? '宫位白话、追问和今日一图由大模型结合盘面依据生成，依据可以展开核对。'
            : '现在用规则版：宫位解读来自排盘引擎和古籍词条；追问只列依据，今日一图不识图。'}
        </Text>
      </View>

      <Text style={styles.section}>隐私</Text>
      <View style={[styles.card, { paddingHorizontal: 16, paddingVertical: 12, gap: 6 }]}>
        <Text style={styles.cardSub}>照片只在你确认后发送，用于当次解读；保存记录时只存一张小缩略图。数据按这台设备匿名保存；提问和解读会保存在服务器，用于改进解读，删除全部数据时一并删除。</Text>
        <View style={{ alignItems: 'flex-start', marginLeft: -12 }}>
          <TextButton label="删除全部数据" tone="danger" onPress={deleteAll} />
        </View>
      </View>

      <Text style={styles.about}>
        星笺 0.1 · 排盘引擎与古籍原文来自开源项目 ziwei-doushu（MIT 许可）。传统解释是一种观察角度，不是人生定论。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: color.text, fontSize: 34, fontWeight: '700', marginBottom: 6 },
  section: { color: color.text2, fontSize: 13, marginTop: 22, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: color.surface, borderRadius: 16, overflow: 'hidden' },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 64 },
  cardTitle: { color: color.text, fontSize: 17, fontWeight: '500' },
  cardSub: { color: color.text2, fontSize: 14, lineHeight: 20 },
  record: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 64 },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  recordTitle: { color: color.text, fontSize: 16 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 74 },
  emptyText: { color: color.text2, fontSize: 14, padding: 16, lineHeight: 20 },
  about: { color: color.text2, fontSize: 12, lineHeight: 18, marginTop: 26 },
});
