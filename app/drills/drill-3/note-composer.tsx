import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import {
  GestureResponderEvent,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoteComposer } from '@/components/drill/note-composer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// react-native-web renders TextInput as a real DOM <input>/<textarea>, and
// the browser focuses it on mousedown, before the click event bubbles — so
// an outer dismiss-on-tap-outside wrapper still receives that bubbled click
// and calls Keyboard.dismiss(), which immediately blurs the field right
// back out (confirmed live: tapping any field flashed focus then lost it).
// Native's own touch-responder negotiation lets a descendant TextInput
// claim its own touch and never bubbles to an ancestor, so this has no
// native equivalent — the guard is deliberately web-only.
function dismissKeyboardUnlessOnInput(event: GestureResponderEvent) {
  if (Platform.OS === 'web') {
    const target = event.nativeEvent.target as unknown as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
  }
  Keyboard.dismiss();
}

export default function NoteComposerScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Drill 3 — Note composer' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        // Android: deliberately no `behavior` (not the lesson's own
        // 'height' suggestion). This project has `android.edgeToEdgeEnabled`
        // set in app.json, and Expo's own config docs warn that edge-to-edge
        // combined with the default `softwareKeyboardLayoutMode: 'resize'`
        // "may cause unexpected keyboard behavior." Confirmed live on a
        // real Android phone (Expo Go): with `behavior="height"`, the
        // ScrollView was permanently truncated — Tag/Save cut off and
        // unreachable by scrolling — even with the keyboard closed, which
        // rules out an actual keyboard-avoidance timing issue and points at
        // KeyboardAvoidingView's own JS height calc conflicting with
        // Android's native window resize. Android already resizes the
        // window natively for `resize` mode, so `undefined` here lets that
        // handle it and avoids RN's own (edge-to-edge-confused) height
        // override entirely. iOS has no such native resize, so it keeps
        // 'padding' + the lesson's own recommended combination.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}>
        {/*
          keyboardShouldPersistTaps="handled" on the ScrollView is what lets
          a single tap land on the Save button while the keyboard is up —
          without it, that first tap only dismisses the keyboard (lesson's
          own "top-five cause of my button is broken" callout). The outer
          TouchableWithoutFeedback + dismissKeyboardUnlessOnInput is the
          separate half of criterion 5 ("tapping outside dismisses the
          keyboard"): a well-known RN community pattern, not something
          demonstrated in the official Keyboard/TextInput docs, so it's
          called out rather than presented as documented fact. "handled" is
          what keeps the two from fighting each other — persisted taps
          resolve on their target (the button) before this wrapper's own
          dismiss-on-tap fires.
        */}
        <TouchableWithoutFeedback onPress={dismissKeyboardUnlessOnInput} accessible={false}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">Drill 3 — the note composer</ThemedText>
            <ThemedText>
              Title → body focus chain, live 60-char validation, keyboard-safe
              save button. See FINDINGS-drill-3.md for the defence.
            </ThemedText>
            <NoteComposer onSave={(note) => console.log('saved note', note)} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { gap: 16, padding: 24 },
});
