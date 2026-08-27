import { StyleSheet, Text, View } from 'react-native';

// Part 1 — ported from this (given) web CSS:
//
//   .card-row { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 12px; }
//   .card { width: 160px; padding: 12px; border-radius: 8px; background: #eee; }
//
// See FINDINGS-drill-2.md for the annotated diff of the four default
// differences this port touches.
//
// The card's background is a fixed light colour, matching the given web
// CSS exactly — it does not follow the app's dark theme. So the label
// uses a fixed dark colour too, not the theme-aware ThemedText: "there is
// no cascade" cuts both ways — a hardcoded background needs a hardcoded
// text colour to stay readable, since nothing propagates automatically.
export function CardRow({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.label}>{`Card ${i + 1}`}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', // web's `display: flex` gives row for free; RN defaults to column
    flexWrap: 'wrap',
    alignContent: 'flex-start', // already RN's default — kept to mirror the web source 1:1
    gap: 12, // web's `12px` -> unitless dp
  },
  card: {
    width: 160,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
  },
  label: {
    color: '#11181c', // fixed to match the card's fixed background, not the theme
    fontSize: 16,
    lineHeight: 24,
  },
});
