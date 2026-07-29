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
import Svg, { Path, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ApiMessage } from '../types';
import { useAuth } from '../AuthContext';
import { getConversation, sendMessage as apiSendMessage } from '../api/messages';
import { generateAutoReply } from '../api/autoReply';
import { BackBtn } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';
import { MOCK_CONVERSATIONS } from '../data';

// ─── Message status ticks ─────────────────────────────────────────────────────
function TickStatus({ status }: { status?: 'sent' | 'delivered' | 'read' }) {
  if (!status || status === 'sent') {
    // Single grey tick — sent
    return (
      <Svg width={14} height={10} viewBox="0 0 14 10" fill="none">
        <Polyline points="1,5 4,8 9,2" stroke={Colors.paperDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (status === 'delivered') {
    // Double grey ticks — delivered
    return (
      <Svg width={18} height={10} viewBox="0 0 18 10" fill="none">
        <Polyline points="1,5 4,8 9,2" stroke={Colors.paperDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="5,5 8,8 13,2" stroke={Colors.paperDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  // Double gold ticks — read
  return (
    <Svg width={18} height={10} viewBox="0 0 18 10" fill="none">
      <Polyline points="1,5 4,8 9,2" stroke={Colors.goldLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="5,5 8,8 13,2" stroke={Colors.goldLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = (id: string) => `@carenest_messages_${id}`;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
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

  // Get agency name from MOCK_CONVERSATIONS (static import — no dynamic import needed)
  useEffect(() => {
    const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
    if (conv) setAgencyName(conv.otherPartyName);
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
      status: 'sent',
    };

    const updated = [...messages, myMsg];
    setMessages(updated);
    setInputText('');
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    // Try to send via API (silently — optimistic)
    apiSendMessage(conversationId, text).catch(() => {});

    // Advance to "delivered" after a short delay
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === myMsg.id ? { ...m, status: 'delivered' as const } : m)
      );
    }, 800);

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

      // Mark sender's last message as "read" once reply arrives
      setMessages(prev =>
        prev.map(m =>
          m.id === myMsg.id ? { ...m, status: 'read' as const } : m
        )
      );
    } catch {}

    setSending(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Chat-style header */}
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {agencyName.charAt(0).toUpperCase()}
          </Text>
          {/* Online indicator */}
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.headerName} numberOfLines={1}>{agencyName}</Text>
          <Text style={styles.headerStatus}>Online</Text>
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
            <View style={styles.emptyIconBox}>
              <Text style={{ fontSize: 28 }}>💬</Text>
            </View>
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.emptyHint}>Say hello to get the conversation started! 👋</Text>
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
                    { maxWidth: SCREEN_WIDTH * 0.82 },
                  ]}>
                    <Text style={isOwn ? styles.bubbleTextRight : styles.bubbleText}>
                      {m.content}
                    </Text>
                  </View>
                  <View style={[styles.metaRow, isOwn ? styles.metaRight : styles.metaLeft]}>
                    <Text style={[styles.timestamp, isOwn ? styles.timestampRight : styles.timestampLeft]}>
                      {formatTime(m.sentAt)}
                    </Text>
                    {isOwn && <TickStatus status={m.status} />}
                  </View>
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
            accessibilityLabel="Send message"
            accessibilityRole="button"
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
    gap: 10,
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerAvatarText: {
    fontFamily: Fonts.interBold, fontSize: 16, color: Colors.goldLight,
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.paper,
  },
  headerBody: { flex: 1, minWidth: 0 },
  headerName: {
    fontFamily: Fonts.interBold, fontSize: 15, color: Colors.navy,
  },
  headerStatus: {
    fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.success, marginTop: 1,
  },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyText: {
    fontFamily: Fonts.interBold, fontSize: 15,
    color: Colors.navy, textAlign: 'center',
  },
  emptyHint: {
    fontFamily: Fonts.inter, fontSize: 13,
    color: Colors.slate, textAlign: 'center', lineHeight: 20, marginTop: 6,
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
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2, marginHorizontal: 4,
  },
  metaRight: { alignSelf: 'flex-end' },
  metaLeft: { alignSelf: 'flex-start' },
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
