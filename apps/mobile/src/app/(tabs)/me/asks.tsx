import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AskHistoryItem } from '@shared/api';
import { AskRow, askRowSeparator } from '@/components/AskRow';
import { TextButton } from '@/components/Buttons';
import { api } from '@/lib/api';
import { color, space } from '@/theme';

/** 全部问答：所有命盘、所有宫位，新的在前，每次 30 条 */
export default function AskHistory() {
  const [items, setItems] = useState<AskHistoryItem[] | null>(null);
  const [next, setNext] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .asks()
        .then((res) => {
          setItems(res.items);
          setNext(res.next);
        })
        .catch((err) => setError((err as Error).message));
    }, []),
  );

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const res = await api.asks(next);
      setItems((prev) => [...(prev ?? []), ...res.items]);
      setNext(res.next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: color.canvas }} contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: '问答记录', headerBackTitle: '我的' }} />
      {items === null && !error ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: 40 }} />
      ) : items?.length ? (
        <>
          <View style={styles.card}>
            {items.map((a, i) => (
              <View key={a.id}>
                {i > 0 ? <View style={askRowSeparator} /> : null}
                <AskRow item={a} />
              </View>
            ))}
          </View>
          {next ? (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              {loadingMore ? <ActivityIndicator color={color.accent} /> : <TextButton label="加载更早的" tone="accent" onPress={loadMore} />}
            </View>
          ) : null}
          {error ? <Text style={styles.empty}>{error}</Text> : null}
        </>
      ) : (
        <Text style={styles.empty}>{error ?? '还没有问过。在命盘里点开一个宫，就能接着追问。'}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: 16, overflow: 'hidden' },
  empty: { color: color.text2, fontSize: 15, paddingVertical: 24, lineHeight: 22 },
});
