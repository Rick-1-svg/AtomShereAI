/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Exclude nested objects from color names
type SimpleColorKeys = Exclude<keyof typeof Colors.light, 'bottomSheet'>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: SimpleColorKeys
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName] as string;
  }
}
