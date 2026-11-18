import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, gradient, radius } from '@/theme';
import { Icon } from './Icon';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  arrow?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 主按钮：宝石紫渐变 + 细亮边，每屏只放一个 */
export function PrimaryButton({ label, onPress, disabled, loading, arrow, style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.wrap, { opacity: inactive ? 0.55 : pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {loading ? <ActivityIndicator color={color.onPrimary} /> : <Text style={styles.label}>{label}</Text>}
        {arrow && !loading ? (
          <View style={styles.arrow}>
            <Icon name="arrow.right" size={17} tint={color.onPrimary} />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

export function TextButton({ label, onPress, tone = 'accent', disabled }: { label: string; onPress: () => void; tone?: 'accent' | 'danger' | 'muted'; disabled?: boolean }) {
  const tint = tone === 'danger' ? color.danger : tone === 'muted' ? color.text2 : color.accent;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.textBtn, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      <Text style={[styles.textLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(225, 190, 255, 0.55)',
    overflow: 'hidden',
    shadowColor: color.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  fill: { minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 20 },
  label: { color: color.onPrimary, fontSize: 17, fontWeight: '600', letterSpacing: 0.5 },
  arrow: { position: 'absolute', right: 18 },
  textBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  textLabel: { fontSize: 16, fontWeight: '500' },
});
