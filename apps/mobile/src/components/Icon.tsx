import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { color } from '@/theme';

export function Icon({ name, size = 18, tint = color.text2 }: { name: SFSymbol; size?: number; tint?: ColorValue }) {
  return <SymbolView name={name} size={size} tintColor={tint} weight="regular" />;
}
