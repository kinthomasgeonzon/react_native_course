import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DrillIndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 1' }} />
      <ThemedText type="title">Drill 1 — Break the refresh</ThemedText>
      <ThemedText>
        Open a case, tap the counter up a few times, then edit the matching
        file under components/drill/ (e.g. add a space and save) and watch
        the count and the console log.
      </ThemedText>
      <Link href="/drills/case-1" style={styles.link}>
        <ThemedText type="link">Case 1 — component only</ThemedText>
      </Link>
      <Link href="/drills/case-2" style={styles.link}>
        <ThemedText type="link">Case 2 — component + constant</ThemedText>
      </Link>
      <Link href="/drills/case-3" style={styles.link}>
        <ThemedText type="link">Case 3 — constant isolated (fixed)</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24 },
  link: { paddingVertical: 8 },
});
