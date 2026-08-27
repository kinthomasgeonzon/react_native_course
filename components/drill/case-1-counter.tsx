import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Case 1: this file exports ONLY the component — a safe Fast Refresh
// boundary. Edits here should preserve `count` (rule 1).
export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('mounted: case-1');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{count}</ThemedText>
      <Pressable style={styles.button} onPress={() => setCount((c) => c + 1)}>
        <ThemedText style={styles.buttonText}>Tap to increment</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: { color: '#fff' },
});
