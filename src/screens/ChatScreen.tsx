import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import type { ChatMessage } from '../store/chatSlice';

interface Props {
  online: boolean;
  onToggleOnline: (value: boolean) => void;
  onSend: (text: string) => void;
  onRetry: (id: string) => void;
}

function statusLabel(m: ChatMessage): string {
  switch (m.status) {
    case 'queued':
      return m.nextRetryInMs ? `Retrying in ${m.nextRetryInMs / 1000}s (attempt ${m.attempts})` : 'Queued';
    case 'sending':
      return 'Sending…';
    case 'sent':
      return 'Sent';
    case 'failed':
      return 'Failed – tap to retry';
  }
}

export default function ChatScreen({ online, onToggleOnline, onSend, onRetry }: Props) {
  const messages = useAppSelector((s) => s.chat.messages);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Parts chat</Text>
          <Text style={styles.subtitle}>{online ? 'Connected' : 'Offline (messages are queued)'}</Text>
        </View>
        <View style={styles.toggle}>
          <Text>Offline</Text>
          <Switch
            accessibilityLabel="Simulate offline"
            value={!online}
            onValueChange={(v) => onToggleOnline(!v)}
          />
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = item.from === 'me';
          return (
            <Pressable
              disabled={item.status !== 'failed'}
              onPress={() => onRetry(item.id)}
              accessibilityRole={item.status === 'failed' ? 'button' : 'text'}
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            >
              <Text>{item.text}</Text>
              {mine && <Text style={styles.status}>{statusLabel(item)}</Text>}
            </Pressable>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the vendor"
          accessibilityLabel="Message input"
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable style={styles.send} onPress={submit} accessibilityRole="button" accessibilityLabel="Send message">
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { color: '#555' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 12 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#d7e8ff' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  status: { fontSize: 11, color: '#555', marginTop: 4 },
  composer: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  send: { backgroundColor: '#0a5cff', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
});
