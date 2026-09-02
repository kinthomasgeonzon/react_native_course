import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  type PressableProps,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { getButtonPalette, type AppButtonVariant } from '@/lib/drill/button-palette';

export type { AppButtonVariant };

type AppButtonProps = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: AppButtonVariant;
  /** Renders a fixed 24×24 square touch box instead of a padded pill — pair with `hitSlop`. */
  iconOnly?: boolean;
  hitSlop?: PressableProps['hitSlop'];
  /** Required in practice when `iconOnly` (no visible title for a screen reader to read). */
  accessibilityLabel?: string;
  /** Icon or custom content; overrides the default title/spinner row. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const ICON_ONLY_SIZE = 24;

// Drill 4 — one reusable Pressable-backed button.
//
// `disabled` and `loading` both block the press the same way underneath,
// but they're kept as two separate accessibility signals on purpose:
// accessibilityState.disabled tells assistive tech "this will never
// activate as things stand", .busy tells it "temporarily unavailable, will
// accept input again shortly". Collapsing loading into disabled would
// misreport a mid-request button as permanently dead.
export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  iconOnly = false,
  hitSlop,
  accessibilityLabel,
  children,
  style,
  testID,
}: AppButtonProps) {
  const themeTextColor = useThemeColor({}, 'text');
  const isBlocked = disabled || loading;
  const palette = getButtonPalette(variant, themeTextColor);

  if (__DEV__ && iconOnly && !accessibilityLabel) {
    console.warn(
      'AppButton: iconOnly buttons need an explicit accessibilityLabel — there is no title text for a screen reader to fall back to.'
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isBlocked}
      hitSlop={hitSlop}
      // Explicit 0, not left unset: this is the exact knob the lesson names
      // for "imperceptible press latency" — writing it down pins the timing
      // to a value this button depends on, instead of an implicit default
      // someone could change elsewhere without anyone noticing this relies on it.
      unstable_pressDelay={0}
      android_ripple={{ color: palette.ripple, borderless: iconOnly }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, busy: loading }}
      style={({ pressed }) => [
        iconOnly ? styles.iconOnlyBase : styles.base,
        { backgroundColor: palette.background },
        // "Opacity on iOS, ripple on Android" (checklist, item 1): android_ripple
        // above already paints Android's feedback natively; iOS has no ripple,
        // so press feedback there is a plain opacity dim instead.
        Platform.OS === 'ios' && pressed && styles.iosPressed,
        isBlocked && styles.blocked,
        style,
      ]}>
      {children ?? (
        <View style={styles.row}>
          {loading && <ActivityIndicator size="small" color={palette.text} />}
          {title !== undefined && (
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOnlyBase: {
    width: ICON_ONLY_SIZE,
    height: ICON_ONLY_SIZE,
    borderRadius: ICON_ONLY_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  iosPressed: { opacity: 0.6 },
  blocked: { opacity: 0.4 },
});
