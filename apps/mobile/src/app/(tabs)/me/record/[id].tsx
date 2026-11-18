import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, ScrollView, Text, View } from 'react-native';
import type { RecordItem } from '@shared/api';
import { TextButton } from '@/components/Buttons';
import { DailyReadingView } from '@/components/DailyReadingView';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, space } from '@/theme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bumpRecords } = useApp();
  const [record, setRecord] = useState<RecordItem | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.records().then((all) => setRecord(all.find((r) => r.id === id) ?? null)).catch((err) => setError((err as Error).message));
  }, [id]);

  async function remove() {
    try {
      await api.deleteRecord(id);
      bumpRecords();
      router.back();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function confirmRemove() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: '删除这条记录？缩略图和解读会一起删除。', options: ['删除记录', '取消'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (i) => i === 0 && remove(),
      );
    } else {
      Alert.alert('删除这条记录？', undefined, [{ text: '取消', style: 'cancel' }, { text: '删除', style: 'destructive', onPress: remove }]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: '记录', headerBackTitle: '我的', headerRight: () => (record ? <TextButton label="删除" tone="danger" onPress={confirmRemove} /> : null) }} />
      {record === undefined && !error ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: 40 }} />
      ) : record ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 40 }}>
          <DailyReadingView
            reading={record.reading}
            image={record.thumb}
            note={record.note}
            badge={`${record.reading.mode === 'ai' ? 'AI 解读' : '规则解读'}${record.reading.chartKind === 'sample' ? ' · 示例盘' : ''}`}
          />
        </ScrollView>
      ) : (
        <Text style={{ color: color.text2, fontSize: 15, padding: 24 }}>{error ?? '这条记录已经不在了。'}</Text>
      )}
    </View>
  );
}
