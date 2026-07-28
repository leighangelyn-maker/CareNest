import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
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
import { Colors, Fonts, SCREEN_H_PADDING, TAB_BAR_HEIGHT } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MessagesTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STORAGE_KEY = (id: string) => `@carenest_messages_${id}`;
const READ_KEY    = (id: string) => `@carenest_read_${id}`;

function formatTime(iso: string): string {
  try {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// ─── Animated conversation row ────────────────────────────────────────────────
function ConvRow({
  conv, index, onPress,
}: {
  conv: ApiConversation; index: number; onPress: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUnread = conv.unreadCount > 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`Conversation with ${conv.otherPartyName}${conv.unreadCount > 0 ? `, ${conv.unreadCount} unread` : ''}`}
        accessibilityRole="button"
      >
        {/* Avatar */}
        <View style={[styles.avatarBox, isUnread && styles.avatarBoxUnread]}>
          <Text style={styles.avatarText}>
            {conv.otherPartyName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>

        {/* Body */}
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text
              style={[styles.convName, isUnread && styles.convNameUnread]}
              numberOfLines={1}
            >
              {conv.otherPartyName}
            </Text>
            <Text style={styles.time}>{formatTime(conv.lastMessageAt)}</Text>
          </View>

          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, isUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {conv.lastMessage}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.centre}>
      <View style={styles.emptyIconBox}>
        <Text style={styles.emptyEmoji}>💬</Text>
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyBody}>
        Once you book an agency, you can message them here.
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MessagesListScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = await getConversations();

      const enriched: ApiConversation[] = await Promise.all(
        base.map(async (conv) => {
          try {
            const stored   = await AsyncStorage.getItem(STORAGE_KEY(conv.id));
            const readTime = await AsyncStorage.getItem(READ_KEY(conv.id));
            if (!stored) return conv;

            const msgs: ApiMessage[] = JSON.parse(stored);
            if (msgs.length === 0) return conv;

            const last        = msgs[msgs.length - 1];
            const unreadCount = readTime
              ? msgs.filter(m =>
                  new Date(m.sentAt).getTime() > new Date(readTime).getTime()
                ).length
              : conv.unreadCount;

            return { ...conv, lastMessage: last.content, lastMessageAt: last.sentAt, unreadCount };
          } catch { return conv; }
        })
      );

      enriched.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      setConversations(enriched);

      // Update tab bar badge with total unread
      const totalUnread = enriched.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      navigation.setOptions({
        tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleOpen(conv: ApiConversation) {
    await AsyncStorage.setItem(READ_KEY(conv.id), new Date().toISOString());
    const updated = conversations.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c);
    setConversations(updated);

    // Recalculate badge
    const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    navigation.setOptions({ tabBarBadge: totalUnread > 0 ? totalUnread : undefined });

    navigation.navigate('Messages', { conversationId: conv.id });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Eyebrow>Inbox</Eyebrow>
        <ScreenTitle>Messages</ScreenTitle>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : error ? (
        <View style={styles.centre}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: 14, width: '70%' }}>
            <Btn onPress={load}>Retry</Btn>
          </View>
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: c, index }) => (
            <ConvRow conv={c} index={index} onPress={() => handleOpen(c)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  header: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },

  centre: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  errorText: {
    fontFamily: Fonts.inter, fontSize: 13,
    color: Colors.danger, textAlign: 'center', marginBottom: 4,
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 14,
    backgroundColor: Colors.paper,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.line,
    marginLeft: SCREEN_H_PADDING + 44 + 12, // indent past avatar
  },

  // Avatar
  avatarBox: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.navyPale,
    borderWidth: 1.5, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 13, flexShrink: 0,
  },
  avatarBoxUnread: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  avatarText: {
    fontFamily: Fonts.interBold, fontSize: 17, color: Colors.goldLight,
  },

  // Body
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  convName: {
    fontFamily: Fonts.inter, fontSize: 14,
    color: Colors.navy, flex: 1, marginRight: 8,
  },
  convNameUnread: { fontFamily: Fonts.interBold },
  time: {
    fontFamily: Fonts.inter, fontSize: 11,
    color: Colors.slateSoft, flexShrink: 0,
  },
  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  preview: {
    fontFamily: Fonts.inter, fontSize: 13,
    color: Colors.slateSoft, flex: 1,
  },
  previewUnread: {
    color: Colors.slate,
    fontFamily: Fonts.interMedium,
  },

  // Unread badge
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  unreadBadgeText: {
    fontFamily: Fonts.interBold, fontSize: 10, color: Colors.goldLight,
  },

  // Empty state
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.navyPale,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: {
    fontFamily: Fonts.interBold, fontSize: 15,
    color: Colors.navy, textAlign: 'center', marginBottom: 6,
  },
  emptyBody: {
    fontFamily: Fonts.inter, fontSize: 13,
    color: Colors.slate, lineHeight: 20, textAlign: 'center',
  },
});
