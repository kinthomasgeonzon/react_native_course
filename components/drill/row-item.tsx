import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Row } from '@/lib/drill/rows';

const HUES = 12;

// A small per-row computation (hash → hue) on purpose: a real list row is
// never a bare Text node, and a zero-cost row would flatter both
// ScrollView and FlatList equally, hiding the difference the drill asks
// about. Kept cheap (one loop over a short string) so it's realistic, not
// artificially heavy.
function hueFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % HUES;
}

export const RowItem = memo(function RowItem({ row }: { row: Row }) {
  const hue = hueFor(row.id);
  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: `hsl(${(hue * 360) / HUES}, 65%, 55%)` }]}>
        <ThemedText style={styles.avatarText}>{row.name.charAt(0)}</ThemedText>
      </View>
      <View style={styles.textColumn}>
        <ThemedText type="defaultSemiBold">{row.name}</ThemedText>
        <ThemedText style={styles.subtitle}>{row.id}</ThemedText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 56 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  textColumn: { flex: 1 },
  subtitle: { fontSize: 12, opacity: 0.6 },
});
