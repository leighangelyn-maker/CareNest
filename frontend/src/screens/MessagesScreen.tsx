import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ApiMessage } from '../types';
import { useAuth } from '../AuthContext';
import { getConversation, sendMessage as apiSendMessage } from '../api/messages';
import { generateAutoReply } from '../api/autoReply';
import { BackBtn, Eyebrow, ScreenTitle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = (id: string) => `@carenest_messages_${id}`;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function MessagesScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { id: userId, firstName, lastName } = useAuth();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [agencyName, setAgencyName] = useState('Agency');
  const listRef = useRef<FlatList>(null);

  // ── Load messages from storage + API ──────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load persisted messages first (instant)
      const stored = await AsyncStorage.getItem(STORAGE_KEY(conversationId));
      const persisted: ApiMessage[] = stored ? JSON.parse(stored) : [];

      // 2. Fetch from API / mock
      const data = await getConversation(conversationId);
      const fetched = data.messages ?? [];

      // 3. Merge: fetched messages + any locally-sent messages not in fetched
      const fetchedIds = new Set(fetched.map(m => m.id));
      const localOnly = persisted.filter(m => !fetchedIds.has(m.id));
      const merged = [...fetched, ...localOnly].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      setMessages(merged);

      // Persist merged set
      await AsyncStorage.setItem(STORAGE_KEY(conversationId), JSON.stringify(merged));
    } catch {
      // If everything fails, show persisted messages
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY(conversationId));
        if (stored) setMessages(JSON.parse(stored));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Get agency name from MOCK_CONVERSATIONS
  useEffect(() => {
    import('../data').then(({ MOCK_CONVERSATIONS }) => {
      const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
      if (conv) setAgencyName(conv.otherPartyName);
    });
  }, [conversationId]);

  // ── Persist messages whenever they change ──────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY(conversationId), JSON.stringify(messages));
    }
  }, [messages, conversationId]);

  // ── Send message ───────────────────────────────────────────────────────────
  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;

    const myMsg: ApiMessage = {
      id: `local-${Date.now()}`,
      conversationId,
      senderId: userId ?? 'me',
      senderName: firstName ? `${firstName} ${lastName ?? ''}`.trim() : 'You',
      content: text,
      sentAt: new Date().toISOString(),
    };

    const updated = [...messages, myMsg];
    setMessages(updated);
    setInputText('');
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    // Try to send via API (silently — optimistic)
    apiSendMessage(conversationId, text).catch(() => {});

    // Generate context-aware auto-reply
    try {
      const history = updated.slice(-6).map(m => ({
        role: (m.senderId === userId || m.senderId === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const reply = await generateAutoReply({
        agencyName,
        userMessage: text,
        conversationHistory: history,
      });

      const replyMsg: ApiMessage = {
        id: `auto-${Date.now()}`,
        conversationId,
        senderId: `agency-${conversationId}`,
        senderName: agencyName,
        content: reply,
        sentAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, replyMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {}

    setSending(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <View>
          <Eyebrow>{agencyName}</Eyebrow>
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 16 : 18}>Messages</ScreenTitle>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centred}>
            <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item: m }) => {
              const isOwn = m.senderId === userId || m.senderId === 'me';
              return (
                <View style={[styles.msgRow, isOwn ? styles.msgRowRight : styles.msgRowLeft]}>
                  {!isOwn && (
                    <Text style={styles.senderName}>{m.senderName}</Text>
                  )}
                  <View style={[
                    styles.bubble,
                    isOwn ? styles.bubbleRight : styles.bubbleLeft,
                    { maxWidth: SCREEN_WIDTH * 0.75 },
                  ]}>
                    <Text style={isOwn ? styles.bubbleTextRight : styles.bubbleText}>
                      {m.content}
                    </Text>
                  </View>
                  <Text style={[styles.timestamp, isOwn ? styles.timestampRight : styles.timestampLeft]}>
                    {formatTime(m.sentAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message…"
            placeholderTextColor={Colors.slateSoft}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            allowFontScaling={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.goldLight} />
              : <Text style={styles.sendBtnText}>Send</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: {
    fontFamily: Fonts.inter, fontSize: 14,
    color: Colors.slate, textAlign: 'center', lineHeight: 22,
  },
  messagesList: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 12,
    gap: 6,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  msgRow: { marginVertical: 2 },
  msgRowLeft: { alignItems: 'flex-start' },
  msgRowRight: { alignItems: 'flex-end' },
  senderName: {
    fontFamily: Fonts.interSemiBold, fontSize: 11,
    color: Colors.slate, marginBottom: 2, marginLeft: 4,
  },
  bubble: { padding: 11, borderRadius: 16 },
  bubbleLeft: { backgroundColor: Colors.navyPale, borderBottomLeftRadius: 4 },
  bubbleRight: { backgroundColor: Colors.navy, borderBottomRightRadius: 4 },
  bubbleText: {
    fontFamily: Fonts.inter, fontSize: 14,
    color: Colors.ink, lineHeight: 20,
    flexShrink: 1,
  },
  bubbleTextRight: {
    fontFamily: Fonts.inter, fontSize: 14,
    color: Colors.paper, lineHeight: 20,
    flexShrink: 1,
  },
  timestamp: {
    fontFamily: Fonts.inter, fontSize: 10,
    color: Colors.slateSoft, marginTop: 2, marginHorizontal: 4,
  },
  timestampLeft: { alignSelf: 'flex-start' },
  timestampRight: { alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'android' ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    gap: 8,
    backgroundColor: Colors.paper,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.navyPale,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Colors.ink,
    maxHeight: 90,
    minHeight: 40,
  },
  sendBtn: {
    backgroundColor: Colors.navy, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    minWidth: 60, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    fontFamily: Fonts.interSemiBold, fontSize: 13,
    color: Colors.goldLight,
  },
});
