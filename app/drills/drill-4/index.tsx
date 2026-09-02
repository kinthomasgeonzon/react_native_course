import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Drill4IndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 4' }} />
      <ThemedText type="title">Drill 4 — One button to rule them all</ThemedText>
      <ThemedText>
        Week 1 Day 4, &quot;Touch and Press Handling&quot;. See
        FINDINGS-drill-4.md at the repo root for the annotated defence.
      </ThemedText>
      <Link href="/drills/drill-4/gallery" style={styles.link}>
        <ThemedText type="link">AppButton gallery — variants, loading, icon button</ThemedText>
      </Link>
      <Link href="/drills/drill-4/bounds-clipping" style={styles.link}>
        <ThemedText type="link">Bounds-clipping repro — why your tap went somewhere else</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  link: { paddingVertical: 8 },
});
