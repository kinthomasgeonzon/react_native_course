import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Stack } from 'expo-router';

import { AppButton } from '@/components/drill/app-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

// The lesson's own worked example: a 24×24 icon needs 12pt of hitSlop on
// every side to reach the 48dp Android/44pt iOS floor (24 + 12 + 12 = 48).
const ICON_VISUAL_SIZE = 24;
const ICON_HIT_SLOP = 12;
const ICON_EFFECTIVE_TARGET = ICON_VISUAL_SIZE + ICON_HIT_SLOP * 2;
const SAVE_DELAY_MS = 1200;

export default function AppButtonGalleryScreen() {
  const [primaryTaps, setPrimaryTaps] = useState(0);
  const [secondaryTaps, setSecondaryTaps] = useState(0);
  const [dangerTaps, setDangerTaps] = useState(0);
  const [disabledTaps, setDisabledTaps] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStarts, setSaveStarts] = useState(0);
  const [iconTaps, setIconTaps] = useState(0);
  const [showDebugOutline, setShowDebugOutline] = useState(true);
  const iconColor = useThemeColor({}, 'text');

  const handleSave = () => {
    setIsSaving(true);
    // `saveStarts` exists purely to make "onPress never fires when disabled
    // or loading" observable from outside: tapping repeatedly while a save
    // is in flight must not bump this past 1 per save cycle.
    setSaveStarts((n) => n + 1);
    setTimeout(() => setIsSaving(false), SAVE_DELAY_MS);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'AppButton gallery' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Variants</ThemedText>
        <ThemedText>Same component, three palettes. Each counter proves onPress actually fires.</ThemedText>
        <View style={styles.row}>
          <AppButton title="Primary" onPress={() => setPrimaryTaps((n) => n + 1)} />
          <AppButton
            title="Secondary"
            variant="secondary"
            onPress={() => setSecondaryTaps((n) => n + 1)}
          />
          <AppButton title="Danger" variant="danger" onPress={() => setDangerTaps((n) => n + 1)} />
        </View>
        <ThemedText style={styles.caption}>
          Primary: {primaryTaps} · Secondary: {secondaryTaps} · Danger: {dangerTaps}
        </ThemedText>

        <ThemedText type="subtitle">Disabled</ThemedText>
        <ThemedText>
          `disabled` gates the press at the Pressable level — the counter below must stay at 0 no
          matter how many times this is tapped.
        </ThemedText>
        <AppButton title="Can't touch this" disabled onPress={() => setDisabledTaps((n) => n + 1)} />
        <ThemedText style={styles.caption}>Disabled taps registered: {disabledTaps}</ThemedText>

        <ThemedText type="subtitle">Loading</ThemedText>
        <ThemedText>
          Tap Save, then tap it again immediately — the second tap must be a no-op while
          `loading` is true, and the spinner replaces nothing else in layout.
        </ThemedText>
        <AppButton title={isSaving ? 'Saving…' : 'Save'} loading={isSaving} onPress={handleSave} />
        <ThemedText style={styles.caption}>Save starts: {saveStarts}</ThemedText>

        <ThemedText type="subtitle">24×24 icon button</ThemedText>
        <ThemedText>
          Visual box stays {ICON_VISUAL_SIZE}×{ICON_VISUAL_SIZE}; `hitSlop={ICON_HIT_SLOP}` on
          every side brings the effective, tappable target to {ICON_EFFECTIVE_TARGET}×
          {ICON_EFFECTIVE_TARGET} — at the 48dp Android / 44pt iOS floor from the lesson.
        </ThemedText>
        <View style={styles.toggleRow}>
          <ThemedText>Show tap-target debug outline</ThemedText>
          <Switch value={showDebugOutline} onValueChange={setShowDebugOutline} />
        </View>
        <View style={styles.iconDemoWrapper}>
          {showDebugOutline && <View pointerEvents="none" style={styles.hitSlopOutline} />}
          <AppButton
            iconOnly
            variant="ghost"
            hitSlop={ICON_HIT_SLOP}
            accessibilityLabel="Send"
            onPress={() => setIconTaps((n) => n + 1)}>
            <IconSymbol name="paperplane.fill" size={ICON_VISUAL_SIZE} color={iconColor} />
          </AppButton>
        </View>
        <ThemedText style={styles.caption}>
          Icon taps: {iconTaps} — try tapping just outside the solid icon, still inside the
          dashed outline; it should still count.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12, padding: 24 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  caption: { fontSize: 13, opacity: 0.7 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDemoWrapper: {
    width: ICON_EFFECTIVE_TARGET,
    height: ICON_EFFECTIVE_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitSlopOutline: {
    position: 'absolute',
    width: ICON_EFFECTIVE_TARGET,
    height: ICON_EFFECTIVE_TARGET,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5484d',
    backgroundColor: 'rgba(229,72,77,0.12)',
  },
});
