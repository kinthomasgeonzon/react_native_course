import { Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { CardRow } from '@/components/drill/card-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CardRowScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Part 1 — Card row' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Part 1 — card row, ported from web</ThemedText>
        <ThemedText>
          Wrapping card row: display: flex, flex-wrap, align-content, gap,
          px units on web. See FINDINGS-drill-2.md for the annotated diff.
        </ThemedText>
        <CardRow />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16, padding: 24 },
});
