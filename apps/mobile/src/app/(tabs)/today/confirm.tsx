import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { dateLabel, localDate } from '@/lib/format';
import { pickPhoto, uploadVersion } from '@/lib/photo';
import { color, space } from '@/theme';

export default function ConfirmPhoto() {
  const insets = useSafeAreaInsets();
  const { photo, setPhoto, note, setNote, me, setDaily } = useApp();
  const [stage, setStage] = useState<'idle' | 'preparing' | 'reading'>('idle');
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const today = localDate();
  const aiOn = me?.ai.enabled ?? false;

  async function replace() {
    const picked = await pickPhoto();
    if (picked) setPhoto(picked);
  }

  async function submit() {
    if (!photo) return;
    setError(null);
    abort.current = new AbortController();
    try {
      setStage('preparing');
      const image = await uploadVersion(photo);
      setStage('reading');
      const reading = await api.daily({ date: today, image, note: note.trim() || undefined }, abort.current.signal);
      setDaily({ reading, photo, note: note.trim() });
      // 用 replace：解读页返回直接回到「今日」，不再回到确认页
      router.replace('/today/reading');
    } catch (err) {
      // 取消或失败都保留照片和写好的文字
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      setStage('idle');
      abort.current = null;
    }
  }

  const busy = stage !== 'idle';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.canvas }} behavior="padding" keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: '确认画面', headerBackTitle: '今日' }} />
      <ScrollView contentContainerStyle={{ padding: space.page, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {photo ? (
          <>
            <Image
              source={{ uri: photo.uri }}
              style={[styles.preview, { aspectRatio: Math.max(photo.width / photo.height, 0.75) }]}
              contentFit="cover"
              accessibilityLabel="选好的照片"
            />
            <View style={styles.actions}>
              <TextButton label="换一张" onPress={replace} disabled={busy} />
              <TextButton
                label="移除"
                tone="muted"
                disabled={busy}
                onPress={() => {
                  setPhoto(null);
                  router.back();
                }}
              />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>照片已经移除了。</Text>
            <TextButton label="重新选一张" onPress={replace} />
          </View>
        )}

        <Text style={styles.label}>你想聊些什么？</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="可不填，比如：今天想慢一点"
          placeholderTextColor={color.text2}
          style={styles.input}
          multiline
          maxLength={200}
          editable={!busy}
          accessibilityLabel="补充一句话"
        />

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>命盘</Text>
            <Text style={styles.infoVal}>{me?.chart.kind === 'personal' ? `${me.chart.title} · ${me.chart.summary}` : '示例盘'}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>日期</Text>
            <Text style={styles.infoVal}>{dateLabel(today)}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Icon name="lock" size={14} />
          <Text style={styles.noticeText}>
            {aiOn
              ? '点下面的按钮后，照片会压缩后发送给解读服务，只用于这一次分析，不会公开。保存记录时只留一张小缩略图。'
              : '解读服务还没接入识图，这次只结合命盘和你写的话，照片不会上传。'}
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {busy ? (
          <View style={styles.progress}>
            <Text style={styles.progressText}>{stage === 'preparing' ? '正在准备照片…' : aiOn ? '正在看画面，联系命盘…' : '正在联系命盘…'}</Text>
            <TextButton label="取消" tone="muted" onPress={() => abort.current?.abort()} />
          </View>
        ) : null}
        <PrimaryButton label="联系命盘，看今天" onPress={submit} disabled={!photo} loading={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', maxHeight: 360, borderRadius: 18, backgroundColor: color.surface },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 4 },
  empty: { backgroundColor: color.surface, borderRadius: 18, padding: 24, alignItems: 'center', gap: 6 },
  emptyText: { color: color.text2, fontSize: 15 },
  label: { color: color.text, fontSize: 17, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 88, backgroundColor: color.surface, borderRadius: 14, padding: 14, paddingTop: 14, color: color.text, fontSize: 16, textAlignVertical: 'top' },
  info: { backgroundColor: color.surface, borderRadius: 14, marginTop: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, minHeight: 46, gap: 12 },
  infoKey: { color: color.text2, fontSize: 15 },
  infoVal: { color: color.text, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 14 },
  notice: { flexDirection: 'row', gap: 8, marginTop: 16 },
  noticeText: { flex: 1, color: color.text2, fontSize: 13, lineHeight: 19 },
  error: { color: color.danger, fontSize: 14, marginTop: 12 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.page, paddingTop: 10, gap: 6, backgroundColor: color.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { color: color.text2, fontSize: 14 },
});
