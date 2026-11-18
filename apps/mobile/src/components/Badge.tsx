import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { color } from '@/theme';

export function Badge({ label, tone = 'accent', style }: { label: string; tone?: 'accent' | 'gold'; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, tone === 'gold' && styles.gold, style]}>
      <Text style={[styles.text, tone === 'gold' && { color: color.gold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: color.related,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  gold: { backgroundColor: 'rgba(255, 215, 143, 0.12)' },
  text: { color: color.accent, fontSize: 12, fontWeight: '500' },
});
