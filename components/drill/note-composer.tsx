import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const TITLE_MAX_LENGTH = 60;

export type Note = { title: string; body: string; tag: string };

// Drill 3 — the note composer. Three controlled fields, one focus chain,
// one validation rule. See FINDINGS-drill-3.md for the defence of every
// prop choice below.
//
// `maxLength` sits right in the lesson's own props table ("Hard cap,
// enforced by the input"), but it's deliberately NOT used on `title`: the
// acceptance criterion is "save is disabled ... when ... over 60
// characters", which requires the user to actually be ABLE to type past
// 60 so that invalid state is reachable at all. A hard `maxLength={60}`
// would make this branch dead code.
export function NoteComposer({ onSave }: { onSave?: (note: Note) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const bodyRef = useRef<TextInput>(null);

  // Unlike ThemedText/ThemedView, RN's own TextInput does not follow the
  // theme — it defaults to black typed text with no background, same "no
  // cascade" gap drill-2 caught on CardRow's label. On web this is masked
  // by Chromium auto-styling unstyled <input> elements for dark mode, which
  // made it look fine in this project's only headless-testable environment
  // even though it would render invisible black-on-dark on a real device.
  // Wiring both colors through the same hook ThemedText/ThemedView use
  // closes that gap for real, not just on the web proxy.
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'icon');

  const isTitleInvalid = title.trim().length === 0 || title.length > TITLE_MAX_LENGTH;

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText style={styles.label}>Title</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
          placeholderTextColor={placeholderColor}
          style={[styles.input, { color: textColor }, isTitleInvalid && styles.inputInvalid]}
          returnKeyType="next"
          // Single-line default is `submitBehavior="blurAndSubmit"` — return
          // blurs this field AND fires onSubmitEditing in the same gesture,
          // so handing focus to `body` here is the entire chain. Written
          // explicitly (it's already the default) to document the choice,
          // same habit as drill-2's `alignContent: 'flex-start'`.
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => bodyRef.current?.focus()}
        />
        <ThemedText
          style={styles.counter}
          // Stretch goal, as literally specified. `accessibilityLiveRegion`
          // (and its cross-platform alias `aria-live`) is Android-only per
          // the RN accessibility docs — VoiceOver on iOS does not announce
          // this. An iOS-equivalent live announcement would need
          // `AccessibilityInfo.announceForAccessibility()` fired from
          // `onChangeText`, which is out of scope for what the drill asked.
          accessibilityLiveRegion="polite">
          {title.length}/{TITLE_MAX_LENGTH}
        </ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Body</ThemedText>
        <TextInput
          ref={bodyRef}
          value={body}
          onChangeText={setBody}
          placeholder="Write your note…"
          placeholderTextColor={placeholderColor}
          style={[styles.input, styles.bodyInput, { color: textColor }]}
          multiline
          // Multiline default is already `submitBehavior="newline"` — return
          // inserts a newline and never fires onSubmitEditing. Written
          // explicitly for the same reason as above: it's the requirement
          // ("body's return inserts a newline"), not an accident of the
          // default, so it's worth being explicit about which one is doing
          // the work.
          submitBehavior="newline"
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Tag</ThemedText>
        <TextInput
          value={tag}
          onChangeText={setTag}
          placeholder="#tag"
          placeholderTextColor={placeholderColor}
          style={[styles.input, { color: textColor }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>

      <Pressable
        onPress={() => onSave?.({ title, body, tag })}
        disabled={isTitleInvalid}
        style={[styles.saveButton, isTitleInvalid && styles.saveButtonDisabled]}>
        <ThemedText style={styles.saveButtonText}>Save</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  field: { gap: 4 },
  label: { fontSize: 13, opacity: 0.7 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputInvalid: {
    borderColor: '#e5484d', // reused from chat-bubble-row's unread-dot red
    borderWidth: 1.5,
  },
  bodyInput: {
    minHeight: 100,
    textAlignVertical: 'top', // Android multiline defaults to vertically centered text; iOS already top-aligns
  },
  counter: { fontSize: 12, opacity: 0.6, alignSelf: 'flex-end' },
  saveButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  saveButtonDisabled: {
    backgroundColor: '#0a7ea4',
    opacity: 0.4,
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
