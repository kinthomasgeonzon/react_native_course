import { Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ChatBubbleRow } from '@/components/drill/chat-bubble-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// 4 x 112 chars = 448 chars, clears the drill's "survives a 400-character
// message" acceptance criterion.
const LONG_MESSAGE =
  'This is a deliberately long chat message, used to verify the row never overflows and the timestamp never clips. '.repeat(
    4
  );

export default function ChatRowScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Part 2 — Chat row' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Part 2 — chat bubble row</ThemedText>
        <ThemedText>
          Fixed avatar, growing/shrinking message body, non-shrinking
          timestamp, absolutely positioned unread dot. See
          FINDINGS-drill-2.md for the defence.
        </ThemedText>
        <ChatBubbleRow message="Hey, are we still on for tomorrow?" timestamp="9:41 AM" unread />
        <ChatBubbleRow message={LONG_MESSAGE} timestamp="9:52 AM" />
        <ChatBubbleRow message="Short one." timestamp="10:03 AM" unread />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 4, padding: 24 },
});
