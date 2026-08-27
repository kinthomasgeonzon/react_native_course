import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Drill2IndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 2' }} />
      <ThemedText type="title">Drill 2 — Port and defend</ThemedText>
      <ThemedText>
        Week 1 Day 2, &quot;Layout and Flexbox on Native&quot;. See
        FINDINGS-drill-2.md at the repo root for the annotated diff and
        defence.
      </ThemedText>
      <Link href="/drills/drill-2/card-row" style={styles.link}>
        <ThemedText type="link">Part 1 — Card row (web → native port)</ThemedText>
      </Link>
      <Link href="/drills/drill-2/chat-row" style={styles.link}>
        <ThemedText type="link">Part 2 — Chat bubble row</ThemedText>
      </Link>
      <Link href="/drills/drill-2/themed-text" style={styles.link}>
        <ThemedText type="link">ThemedText — DynamicColorIOS / PlatformColor</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  link: { paddingVertical: 8 },
});
