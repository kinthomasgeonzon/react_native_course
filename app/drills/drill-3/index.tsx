import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Drill3IndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 3' }} />
      <ThemedText type="title">Drill 3 — The note composer</ThemedText>
      <ThemedText>
        Week 1 Day 3, &quot;Text, Input and Forms&quot;. See
        FINDINGS-drill-3.md at the repo root for the annotated defence.
      </ThemedText>
      <Link href="/drills/drill-3/note-composer" style={styles.link}>
        <ThemedText type="link">Note composer — title, body, tag, save</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  link: { paddingVertical: 8 },
});
