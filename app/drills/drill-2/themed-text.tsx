import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText as DrillThemedText } from '@/components/drill/themed-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ThemedTextDemoScreen() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'ThemedText demo' }} />
      <ThemedText type="subtitle">Drill 2 — ThemedText demo</ThemedText>
      <ThemedText>
        Detected system scheme (informational only — DynamicColorIOS and
        PlatformColor resolve natively, independent of this hook):{' '}
        {scheme ?? 'unknown'}
      </ThemedText>
      <DrillThemedText style={styles.sample}>
        This text is colored with DynamicColorIOS on iOS and PlatformColor
        on Android. Toggle the system theme (device/simulator Settings) and
        reload to see it change live — see FINDINGS-drill-2.md for how to
        capture the two screenshots this criterion asks for.
      </DrillThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  sample: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 8,
    padding: 12,
  },
});
