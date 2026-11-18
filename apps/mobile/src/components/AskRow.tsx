import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AskHistoryItem } from '@shared/api';
import { Icon } from '@/components/Icon';
import { dateLabel, localDate } from '@/lib/format';
import { color } from '@/theme';

/** 问答记录里的一行：宫位和日期、问题、回答开头。点开看完整回答 */
export function AskRow({ item }: { item: AskHistoryItem }) {
  const meta = `${item.palace} · ${dateLabel(localDate(new Date(item.createdAt)), false)}${item.isCurrentChart ? '' : ' · 旧命盘'}`;
  return (
    <Pressable onPress={() => router.push(`/me/ask/${item.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.surface2 }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.meta}>{meta}</Text>
        <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        {item.answer ? <Text style={styles.answer} numberOfLines={1}>{item.answer}</Text> : null}
      </View>
      <Icon name="chevron.right" size={12} />
    </Pressable>
  );
}

export const askRowSeparator = { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 16 };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 },
  meta: { color: color.text2, fontSize: 12 },
  question: { color: color.text, fontSize: 16, lineHeight: 22 },
  answer: { color: color.text2, fontSize: 14, lineHeight: 20 },
});
