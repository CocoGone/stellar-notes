import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color } from '@/theme';

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: color.surface2, borderRadius: 10, padding: 3 },
  item: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  active: { backgroundColor: color.related, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: color.border },
  label: { color: color.text2, fontSize: 15 },
  activeLabel: { color: color.text, fontWeight: '600' },
});
