import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color } from '@/theme';
import { Icon } from './Icon';

export interface WaitStep {
  label: string;
  state: 'done' | 'active' | 'pending';
  /** 完成后补一句结果，如「已压缩到 180 KB」 */
  detail?: string;
}

interface Props {
  steps: WaitStep[];
  /** 开始等待的时间戳，用来显示已等了几秒；还没开始时不计时 */
  startedAt?: number;
  /** 正常情况下要等多久，如「通常 15–30 秒」 */
  typical: string;
  /** 超过这个秒数提示比平时久 */
  slowAfter?: number;
}

/** 等待大模型时的真实进度：哪些步骤做完了、正在做哪一步、已经等了多久 */
export function WaitStatus({ steps, startedAt, typical, slowAfter = 45 }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const slow = seconds >= slowAfter;

  return (
    <View style={styles.box} accessibilityRole="progressbar" accessibilityLabel={`${steps.find((s) => s.state === 'active')?.label ?? ''}，已等待 ${seconds} 秒`}>
      {steps.map((s) => (
        <View key={s.label} style={styles.row}>
          <View style={styles.mark}>
            {s.state === 'done' ? (
              <Icon name="checkmark.circle.fill" size={17} tint={color.accent} />
            ) : s.state === 'active' ? (
              <ActivityIndicator size="small" color={color.accent} />
            ) : (
              <Icon name="circle" size={15} tint={color.separator} />
            )}
          </View>
          <Text style={[styles.label, s.state === 'pending' && { color: color.text2 }]}>
            {s.label}
            {s.state === 'active' ? <Text style={styles.time}>  {seconds} 秒</Text> : null}
            {s.state === 'done' && s.detail ? <Text style={styles.time}>  {s.detail}</Text> : null}
          </Text>
        </View>
      ))}
      <Text style={[styles.hint, slow && { color: color.gold }]}>
        {slow ? '比平时久一些，还在等结果。可以继续等，也可以取消后重试。' : `大模型在生成，${typical}。`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: color.surface, borderRadius: 16, padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 },
  mark: { width: 22, alignItems: 'center' },
  label: { flex: 1, color: color.text, fontSize: 15 },
  time: { color: color.text2, fontSize: 13, fontVariant: ['tabular-nums'] },
  hint: { color: color.text2, fontSize: 13, lineHeight: 19, marginTop: 2 },
});
