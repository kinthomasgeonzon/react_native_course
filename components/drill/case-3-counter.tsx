import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Case 3 (TEMPORARILY BROKEN for the drill): THEME is defined and exported
// here again, and lib/drill/theme-consumer.ts now imports it straight from
// this file — a non-React importer reaching into a component file. That
// forces a full reload on every edit (rule 3). Revert to the theme.ts
// import (see git diff / FINDINGS.md) once you've observed it.
export const THEME = { accent: '#7c3aed' };

export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('mounted: case-3');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{count}</ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: THEME.accent }]}
        onPress={() => setCount((c) => c + 1)}>
        <ThemedText style={styles.buttonText}>Tap to incremenst</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff' },
});
