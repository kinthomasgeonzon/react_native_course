import { DynamicColorIOS, Platform, StyleSheet, Text, type ColorValue, type TextProps } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const LIGHT_TEXT = '#11181c';
const DARK_TEXT = '#ecedee';

// Drill 2, criterion 4 — iOS half. DynamicColorIOS is self-contained: the
// OS resolves it natively at paint time, no host-app config required. A
// ternary on Platform.OS (not a Platform.select object literal) means the
// non-iOS branch of this expression never runs, so DynamicColorIOS — which
// isn't even exported from RN's Android build — is never referenced there.
const iosColor: ColorValue =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: LIGHT_TEXT, dark: DARK_TEXT }) : LIGHT_TEXT;

export function ThemedText({ style, ...rest }: TextProps) {
  // Android half. The lesson's own sample reads PlatformColor('?android:
  // attr/textColorPrimary'), but that resolves against the HOST APP's
  // actual applied native theme — and this project has never been
  // through `expo prebuild` (no android/ios folder, no dev client), so it
  // runs inside Expo Go's own shared shell, whose theme this project's
  // app.json cannot control. Confirmed on a real Android device in Expo
  // Go: the text ended up matching the background in both light and dark
  // mode instead of contrasting it. useColorScheme() sidesteps the host
  // theme entirely — it reads the live system setting directly.
  const scheme = useColorScheme();
  const color: ColorValue = Platform.OS === 'ios' ? iosColor : scheme === 'dark' ? DARK_TEXT : LIGHT_TEXT;

  return <Text style={[styles.text, { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 24 },
});
