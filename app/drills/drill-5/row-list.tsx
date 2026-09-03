import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { RowItem } from '@/components/drill/row-item';
import { RowSeparator } from '@/components/drill/row-separator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { makeRows, seededShuffle, type Row } from '@/lib/drill/rows';

const ROW_COUNT = 5000;
const REFRESH_DELAY_MS = 800;
const BASE_ROWS = makeRows(ROW_COUNT);

// Drill 5, deliverable 3 — the "converted list": {id, name} objects, an
// explicit keyExtractor, an ItemSeparatorComponent, and pull-to-refresh via
// RefreshControl. Wired through the `refreshControl` prop with a real
// <RefreshControl> element (not the refreshing/onRefresh shorthand) —
// the checklist names RefreshControl specifically.
export default function RowListScreen() {
  const [rows, setRows] = useState<Row[]>(BASE_ROWS);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshCount((n) => n + 1);
      // Reshuffled, not regenerated — proves the callback actually ran by
      // visibly reordering 5,000 rows, the same "counter proves the path
      // fired" discipline drill-4's gallery used for onPress.
      setRows(seededShuffle(BASE_ROWS, refreshCount + 1));
      setRefreshing(false);
    }, REFRESH_DELAY_MS);
  }, [refreshCount]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Row list' }} />
      <ThemedText style={styles.caption}>
        {ROW_COUNT.toLocaleString()} rows · pull down to refresh · shuffled {refreshCount}×
      </ThemedText>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        renderItem={({ item }) => <RowItem row={item} />}
        ItemSeparatorComponent={RowSeparator}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  caption: { fontSize: 13, opacity: 0.7, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
});
