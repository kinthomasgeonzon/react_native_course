import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { AppButton } from '@/components/drill/app-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const ICON_VISUAL_SIZE = 24;
const PARENT_SIZE = 72;

// Written repro (drill 4, checklist item 4): a child positioned outside its
// parent's layout box never receives touches for the part that's outside —
// this is the native gesture responder system clipping hit-testing, not
// `overflow`. Proven below by NOT setting `overflow` on the parent at all:
// the icon still paints in full, half outside the dashed parent box.
//
// Confirmed by testing (Puppeteer, both mouse-click and touch-emulated taps
// on `npx expo start --web`): react-native-web does NOT reproduce this
// clipping — a tap on the painted-but-outside half still registers there,
// because the DOM just hit-tests wherever the pixels are, with no ancestor
// bounds check. This is a native-only behavior; the untappable half is only
// observable on a real iOS/Android device or simulator. Web can prove the
// geometry (half-in/half-out) and the explanation, not the untappable
// outcome — same class of gap as FINDINGS-drill-3.md's KeyboardAvoidingView
// caveat, just in the opposite direction (web fails to reproduce a real bug,
// rather than being blind to a feature).
export default function BoundsClippingScreen() {
  const [clippedTaps, setClippedTaps] = useState(0);
  const [controlTaps, setControlTaps] = useState(0);
  const iconColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Bounds-clipping repro' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Why your tap went somewhere else</ThemedText>
        <ThemedText>
          The icon button below is positioned so half of it renders outside its parent view — the
          dashed box. Tap the half still inside the dashed box, then tap the half outside it.
        </ThemedText>

        {Platform.OS === 'web' && (
          <View style={styles.webCaveat}>
            <ThemedText style={styles.webCaveatText}>
              Verified by testing: on this web preview, the outside tap still registers — RNW
              doesn&apos;t clip hit-testing to a parent&apos;s bounds the way native iOS/Android do. The
              geometry and explanation below are accurate; the untappable outcome itself only
              shows up on a real device or simulator.
            </ThemedText>
          </View>
        )}

        <View style={[styles.parent, { borderColor }]}>
          <View style={styles.clippedIconWrapper}>
            <AppButton
              iconOnly
              variant="ghost"
              hitSlop={0}
              accessibilityLabel="Half-clipped send button"
              onPress={() => setClippedTaps((n) => n + 1)}>
              <IconSymbol name="paperplane.fill" size={ICON_VISUAL_SIZE} color={iconColor} />
            </AppButton>
          </View>
        </View>
        <ThemedText style={styles.caption}>
          Taps registered on the half-clipped button: {clippedTaps}
        </ThemedText>

        <ThemedText type="subtitle">Control — same button, fully inside its parent</ThemedText>
        <View style={[styles.parent, { borderColor }]}>
          <AppButton
            iconOnly
            variant="ghost"
            hitSlop={0}
            accessibilityLabel="Fully contained send button"
            onPress={() => setControlTaps((n) => n + 1)}
            style={styles.controlIcon}>
            <IconSymbol name="paperplane.fill" size={ICON_VISUAL_SIZE} color={iconColor} />
          </AppButton>
        </View>
        <ThemedText style={styles.caption}>
          Taps registered on the fully-contained control: {controlTaps}
        </ThemedText>

        <View style={styles.explanation}>
          <ThemedText type="defaultSemiBold">Why this happens</ThemedText>
          <ThemedText style={styles.explanationBody}>
            A touch area never extends past its parent view&apos;s bounds. This parent has no{' '}
            <ThemedText type="defaultSemiBold">overflow</ThemedText> style set at all — the icon
            still paints in full, half outside the dashed box — so what you&apos;re seeing isn&apos;t
            CSS clipping the pixels. It&apos;s the gesture responder system clipping hit-testing to
            the parent&apos;s layout box.{' '}
            <ThemedText type="defaultSemiBold">hitSlop does not escape this</ThemedText> either:
            hitSlop only grows the hit rect within/around the element itself, it can&apos;t reach past
            an ancestor&apos;s boundary. The fix is layout, not props — keep the pressable fully
            inside a parent sized to contain it, as the control above does.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12, padding: 24 },
  parent: {
    width: PARENT_SIZE,
    height: PARENT_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  // Half the icon's width sits past the parent's right edge via a negative
  // margin — nothing clips the paint, so it stays fully visible.
  clippedIconWrapper: {
    marginLeft: PARENT_SIZE - ICON_VISUAL_SIZE / 2,
  },
  controlIcon: {
    alignSelf: 'center',
  },
  caption: { fontSize: 13, opacity: 0.7 },
  webCaveat: {
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
    backgroundColor: 'rgba(10,126,164,0.1)',
    padding: 12,
  },
  webCaveatText: { fontSize: 13, lineHeight: 19 },
  explanation: {
    gap: 6,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.1)',
    padding: 16,
  },
  explanationBody: { fontSize: 14, lineHeight: 21 },
});
