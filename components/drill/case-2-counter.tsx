import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Case 2: this file exports the component AND a plain THEME constant.
// That extra non-component export disqualifies the whole module as a
// safe Fast Refresh boundary — edits here re-run the module (rule 2).
export const THEME = { accent: '#c2410c' };

export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('mounted: case-2');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{count}</ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: THEME.accent }]}
        onPress={() => setCount((c) => c + 1)}>
        <ThemedText style={styles.buttonText}>Tap to increment</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff' },
});
