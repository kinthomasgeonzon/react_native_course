import { StyleSheet, View } from 'react-native';

// ItemSeparatorComponent for the row lists — its own component (not an
// inline style on RowItem) because FlatList mounts it only between items,
// never before the first or after the last.
export function RowSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.35)' },
});
