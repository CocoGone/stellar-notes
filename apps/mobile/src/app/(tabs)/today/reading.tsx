import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { DailyReadingView } from '@/components/DailyReadingView';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { thumbnail } from '@/lib/photo';
import { color, space } from '@/theme';

export default function TodayReading() {
  const insets = useSafeAreaInsets();
  const { daily, setDaily, setPhoto, setNote, bumpRecords } = useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!daily) {
    return (
      <View style={styles.empty}>
        <Stack.Screen options={{ title: '今日解读', headerBackTitle: '今日' }} />
        <Text style={styles.emptyText}>还没有今天的解读。</Text>
        <TextButton label="回到今日" onPress={() => router.back()} />
      </View>
    );
  }

  const { reading } = daily;
  const saved = Boolean(daily.savedId);

  async function save() {
    if (!daily) return;
    setSaving(true);
    setError(null);
    try {
      const thumb = daily.photo ? await thumbnail(daily.photo) : undefined;
      const record = await api.saveRecord({ date: reading.day.date, note: daily.note || undefined, thumb, reading });
      setDaily({ ...daily, savedId: record.id });
      // 已保存，清掉草稿，下次进来从头开始
      setPhoto(null);
      setNote('');
      bumpRecords();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: '今日解读', headerBackTitle: '今日' }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 130 }}>
        <DailyReadingView
          reading={reading}
          image={daily.photo?.uri}
          note={daily.note}
          badge={`${reading.mode === 'ai' ? 'AI 解读' : '规则解读'}${reading.chartKind === 'sample' ? ' · 示例盘' : ''}`}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {saved ? <Text style={styles.savedText} accessibilityLiveRegion="polite">已保存，可在「我的 → 记录」里找到。</Text> : null}
        <PrimaryButton label={saved ? '已保存' : '保存到今日记录'} onPress={save} loading={saving} disabled={saved} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: color.text2, fontSize: 15 },
  error: { color: color.danger, fontSize: 14, marginTop: 12 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.page, paddingTop: 10, gap: 8, backgroundColor: color.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  savedText: { color: color.text2, fontSize: 13, textAlign: 'center' },
});
