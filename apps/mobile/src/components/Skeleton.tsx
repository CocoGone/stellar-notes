import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { color } from '@/theme';

export function Skeleton({ lines = 3, widths = ['92%', '100%', '64%'] }: { lines?: number; widths?: string[] }) {
  const [pulse] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [pulse]);
  return (
    <View style={{ gap: 10 }} accessibilityElementsHidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View key={i} style={[styles.line, { width: widths[i % widths.length] as `${number}%`, opacity: pulse }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 14, borderRadius: 7, backgroundColor: color.surface2 },
});
