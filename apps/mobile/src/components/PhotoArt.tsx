import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color } from '@/theme';

/** 今日一图的插画：两张叠放的照片、一座山、一颗星金太阳 */
export function PhotoArt({ size = 150 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 150 123" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x="34" y="14" width="96" height="88" rx="8" stroke={color.border} strokeWidth="2" transform="rotate(4 82 58)" fill={color.surface2} />
      <Rect x="18" y="18" width="104" height="92" rx="8" stroke={color.text} strokeWidth="2.4" fill={color.surface} transform="rotate(-7 70 64)" />
      <Rect x="28" y="28" width="84" height="58" rx="3" fill={color.related} transform="rotate(-7 70 57)" />
      <Path d="M32 82 L56 58 L72 72 L82 64 L108 84" stroke={color.text} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" transform="rotate(-7 70 70)" />
      <Circle cx="96" cy="42" r="7" fill={color.gold} />
      <Path d="M38 100 L78 96" stroke={color.border} strokeWidth="2" strokeLinecap="round" transform="rotate(-7 58 98)" />
    </Svg>
  );
}

/** 解读页的小插画缩略图（示例或没有照片时） */
export function PhotoThumbArt({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x="1" y="1" width="62" height="62" rx="10" fill={color.related} />
      <Rect x="9" y="14" width="46" height="34" rx="3" stroke={color.text} strokeWidth="2" />
      <Path d="M11 44 L25 31 L34 39 L40 34 L53 45" stroke={color.text} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx="44" cy="24" r="4" fill={color.gold} />
    </Svg>
  );
}
