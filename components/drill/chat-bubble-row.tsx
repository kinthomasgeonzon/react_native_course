import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ChatBubbleRowProps = {
  message: string;
  timestamp: string;
  unread?: boolean;
};

// Part 2 — chat bubble row. Four requirements, one style choice each:
//   1. avatar   — fixed 40dp, flexShrink defaults to 0 in RN so it never
//                 squishes even without an explicit flexShrink: 0.
//   2. message  — `flex: 1` (not `flexGrow: 1`) so it both grows into the
//                 leftover row width AND shrinks below its own content
//                 width; `flex: N` equates to flexGrow: N, flexShrink: 1,
//                 flexBasis: 0 per the RN layout-props docs. That shrink is
//                 what stops long text from overflowing the row.
//   3. timestamp — flexShrink again defaults to 0, so it never shrinks.
//   4. unread dot — absolutely positioned against avatarWrap, which must be
//                  the `position: 'relative'` anchor (RN's own default for
//                  `position` already, kept explicit for clarity).
export function ChatBubbleRow({ message, timestamp, unread = false }: ChatBubbleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar} />
        {unread && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.messageBody}>
        <ThemedText>{message}</ThemedText>
      </View>
      <ThemedText style={styles.timestamp}>{timestamp}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5484d',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageBody: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
});
