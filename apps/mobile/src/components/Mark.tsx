import Svg, { Circle, Path } from 'react-native-svg';
import { color } from '@/theme';

/** 「折笺星环」标志：折角笺纸 + 未闭合的星环 + 一颗星金 */
export function Mark({ size = 28, tint = color.accent }: { size?: number; tint?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M18 7.5H38.5L49.5 18.5V55.5H18V7.5Z" stroke={tint} strokeWidth={3.2} strokeLinejoin="round" />
      <Path d="M38.5 7.5V18.5H49.5" stroke={tint} strokeWidth={3.2} strokeLinejoin="round" />
      <Path d="M42.2 30.9A11 11 0 1 1 27.9 24.8" stroke={tint} strokeWidth={2.9} strokeLinecap="round" />
      <Circle cx={37} cy={25.2} r={3.1} fill={color.gold} />
    </Svg>
  );
}
