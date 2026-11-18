import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AskHistoryItem } from '@shared/api';
import { PrimaryButton } from '@/components/Buttons';
import { api } from '@/lib/api';
import { dateLabel, localDate } from '@/lib/format';
import { color, space } from '@/theme';

/** 一条问答：问题、完整回答和依据。是现在这张盘的，可以回到那一宫接着问 */
export default function AskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<AskHistoryItem | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .askItem(id)
      .then(setItem)
      .catch((err) => (err?.status === 404 ? setItem(null) : setError((err as Error).message)));
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: item?.palace || '问答', headerBackTitle: '返回' }} />
      {item === undefined && !error ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: 40 }} />
      ) : item ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 40, gap: 14 }}>
          <Text style={styles.meta}>
            {dateLabel(localDate(new Date(item.createdAt)))}
            {item.isCurrentChart ? '' : ' · 问的是改出生资料以前的命盘'}
          </Text>
          <View style={styles.question}>
            <Text style={styles.questionText}>{item.question}</Text>
          </View>
          <View style={styles.answer}>
            <Text style={styles.answerText}>{item.answer ?? '这次没有拿到回答。'}</Text>
            {item.basis.length ? (
              <View style={{ gap: 4, marginTop: 6 }}>
                <Text style={styles.basisTitle}>依据</Text>
                {item.basis.map((b) => (
                  <Text key={b} style={styles.basis}>· {b}</Text>
                ))}
              </View>
            ) : null}
            {item.mode === 'rules' ? <Text style={styles.modeNote}>规则版回复：未接入大模型</Text> : null}
          </View>
          {item.isCurrentChart ? (
            <PrimaryButton label={`接着问${item.palace}`} onPress={() => router.push(`/chart/ask/${item.branch}`)} />
          ) : null}
        </ScrollView>
      ) : (
        <Text style={{ color: color.text2, fontSize: 15, padding: 24 }}>{error ?? '这条问答已经不在了。'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { color: color.text2, fontSize: 13 },
  question: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: color.primaryDeep, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  questionText: { color: color.onPrimary, fontSize: 16, lineHeight: 23 },
  answer: { alignSelf: 'stretch', backgroundColor: color.surface, borderRadius: 16, padding: 14, gap: 6 },
  answerText: { color: color.text, fontSize: 16, lineHeight: 27 },
  basisTitle: { color: color.text2, fontSize: 13, fontWeight: '600' },
  basis: { color: color.text2, fontSize: 13, lineHeight: 20 },
  modeNote: { color: color.border, fontSize: 12 },
});
