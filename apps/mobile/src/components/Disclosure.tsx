import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { color } from '@/theme';
import { Icon } from './Icon';

/** 可展开区块，对应 SwiftUI 的 DisclosureGroup */
export function Disclosure({ title, children, initiallyOpen = false }: { title: string; children: ReactNode; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
        }}
        style={styles.header}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>
          <Text style={styles.state}>{open ? '收起' : '展开'}</Text>
          <Icon name={open ? 'chevron.up' : 'chevron.down'} size={12} />
        </View>
      </Pressable>
      {open ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: color.text, fontSize: 19, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  state: { color: color.text2, fontSize: 13 },
});
