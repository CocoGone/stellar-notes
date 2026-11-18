import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Mark } from '@/components/Mark';
import { PhotoArt } from '@/components/PhotoArt';
import { useApp } from '@/lib/app-state';
import { dateLabel, localDate } from '@/lib/format';
import { pickPhoto } from '@/lib/photo';
import { color, space } from '@/theme';

export default function TodayHome() {
  const insets = useSafeAreaInsets();
  const { photo, setPhoto, me } = useApp();

  async function choose() {
    const picked = await pickPhoto();
    // 取消选图就回到原页面，不提示错误
    if (!picked) return;
    setPhoto(picked);
    router.push('/today/confirm');
  }

  return (
    <ScrollView style={{ backgroundColor: color.canvas }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: space.page, paddingBottom: 32 }}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">今日一图</Text>
        <Mark size={36} />
      </View>
      <Text style={styles.date}>{dateLabel(localDate())}</Text>

      <View style={styles.card}>
        <PhotoArt size={150} />
        <Text style={styles.cardTitle}>今天，有什么想留下？</Text>
        <Text style={styles.cardSub}>一张风景，一角桌面，一个瞬间。</Text>
      </View>

      <PrimaryButton label="从相册选一张" onPress={choose} style={{ marginTop: 22 }} />
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <TextButton label="先看看示例" onPress={() => router.push('/today/example')} />
      </View>

      {photo ? (
        <Pressable onPress={() => router.push('/today/confirm')} accessibilityRole="button" style={styles.resume}>
          <Icon name="photo.on.rectangle" size={16} tint={color.accent} />
          <Text style={styles.resumeText}>还有一张选好的照片没解读</Text>
          <Icon name="chevron.right" size={12} />
        </Pressable>
      ) : null}

      <View style={styles.rule} />
      <Text style={styles.lead}>把今天的照片，和命盘一起读。</Text>
      <Text style={styles.sub}>先确认画面，再聊聊与你有关的感受。用的是{me?.chart.kind === 'personal' ? '你的命盘' : '示例盘（填写出生资料后换成你的）'}。</Text>
      <View style={styles.lockRow}>
        <Icon name="lock" size={15} />
        <Text style={styles.lockText}>你确认后才分析，照片随时可以删除。</Text>
      </View>
      {photo ? <TextButton label="移除选好的照片" tone="muted" onPress={() => setPhoto(null)} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: color.text, fontSize: 34, fontWeight: '700' },
  date: { color: color.text2, fontSize: 15, marginTop: 6 },
  card: { marginTop: 22, backgroundColor: color.surface, borderRadius: 22, paddingVertical: 30, alignItems: 'center', gap: 8 },
  cardTitle: { color: color.text, fontSize: 19, marginTop: 14, letterSpacing: 1 },
  cardSub: { color: color.text2, fontSize: 13 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.surface, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, marginTop: 8 },
  resumeText: { flex: 1, color: color.text, fontSize: 15 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginVertical: 22 },
  lead: { color: color.text, fontSize: 18 },
  sub: { color: color.text2, fontSize: 14, lineHeight: 21, marginTop: 6 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  lockText: { color: color.text2, fontSize: 13 },
});
