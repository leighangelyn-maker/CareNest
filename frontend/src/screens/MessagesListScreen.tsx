import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, MainTabParamList, ApiConversation, ApiMessage } from '../types';
import { getConversations } from '../api/messages';
import { Btn, Eyebrow, ScreenTitle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MessagesTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STORAGE_KEY = (id: string) => `@carenest_messages_${id}`;
const READ_KEY = (id: string) => `@carenest_read_${id}`;

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function MessagesListScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get base conversations from API/mock
      const base = await getConversations();

      // Enrich with locally persisted messages so sent messages show immediately
      const enriched: ApiConversation[] = await Promise.all(
        base.map(async (conv) => {
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY(conv.id));
            const readTime = await AsyncStorage.getItem(READ_KEY(conv.id));

            if (!stored) return conv;
            const msgs: ApiMessage[] = JSON.parse(stored);
            if (msgs.length === 0) return conv;

            const last = msgs[msgs.length - 1];
            const unreadCount = readTime
              ? msgs.filter(m => new Date(m.sentAt).getTime() > new Date(readTime).getTime()).length
              : conv.unreadCount;

            return {
              ...conv,
              lastMessage: last.content,
              lastMessageAt: last.sentAt,
              unreadCount,
            };
          } catch {
            return conv;
          }
        })
      );

      // Sort by most recent
      enriched.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      setConversations(enriched);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab is focused (picks up new sent messages)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleOpenConversation(conv: ApiConversation) {
    // Mark as read
    await AsyncStorage.setItem(READ_KEY(conv.id), new Date().toISOString());
    // Clear unread badge locally
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );
    navigation.navigate('Messages', { conversationId: conv.id });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Eyebrow>Inbox</Eyebrow>
        <ScreenTitle>Messages</ScreenTitle>
      </View>

      {loading ? (
        <View style={styles.centre}><ActivityIndicator size="large" color={Colors.navy} /></View>
      ) : error ? (
        <View style={styles.centre}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: 14, width: '70%' }}>
            <Btn onPress={load}>Retry</Btn>
          </View>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centre}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyBody}>Book an agency to start messaging.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: c }) => {
            const isUnread = c.unreadCount > 0;
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleOpenConversation(c)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarBox, isUnread && styles.avatarBoxUnread]}>
                  <Text style={styles.avatarText}>{c.otherPartyName?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                      {c.otherPartyName}
                    </Text>
                    <Text style={styles.time}>{formatTime(c.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
                      {c.lastMessage}
                    </Text>
                    {isUnread && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{c.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 14, paddingBottom: 8 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, textAlign: 'center', marginBottom: 6 },
  emptyBody: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  avatarBoxUnread: { backgroundColor: Colors.navy },
  avatarText: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.goldLight },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  name: { fontFamily: Fonts.inter, fontSize: 13.5, color: Colors.navy, flex: 1, marginRight: 8 },
  nameUnread: { fontFamily: Fonts.interBold },
  time: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slateSoft, flexShrink: 0 },
  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  preview: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slateSoft, flex: 1 },
  previewUnread: { color: Colors.slate, fontFamily: Fonts.interMedium },
  badge: {
    backgroundColor: Colors.gold, borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  badgeText: { fontFamily: Fonts.interBold, fontSize: 10, color: '#fff' },
});
