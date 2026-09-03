import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Drill5IndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 5' }} />
      <ThemedText type="title">Drill 5 — Five thousand rows</ThemedText>
      <ThemedText>
        Week 1 Day 5, &quot;Lists and Virtualization&quot;. See FINDINGS-drill-5.md at the repo
        root for the annotated defence.
      </ThemedText>
      <Link href="/drills/drill-5/benchmark" style={styles.link}>
        <ThemedText type="link">Benchmark — ScrollView vs FlatList, 5,000 rows</ThemedText>
      </Link>
      <Link href="/drills/drill-5/row-list" style={styles.link}>
        <ThemedText type="link">Row list — keyExtractor, separator, pull-to-refresh</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  link: { paddingVertical: 8 },
});
