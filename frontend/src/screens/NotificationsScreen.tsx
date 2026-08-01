import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList, ApiNotification } from '../types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notifications';
import { Eyebrow, ScreenTitle, Btn } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING, TAB_BAR_HEIGHT } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'NotificationsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getNotifications();
      setItems(data);

      const unread = data.filter(n => !n.isRead).length;
      navigation.setOptions({
        tabBarBadge: unread > 0 ? unread : undefined,
      });
    } catch (e: any) {
      setError(
        e?.response?.status
          ? `Request failed with status code ${e.response.status}`
          : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function updateBadge(next: ApiNotification[]) {
    const unread = next.filter(n => !n.isRead).length;
    navigation.setOptions({ tabBarBadge: unread > 0 ? unread : undefined });
  }

  async function handlePress(item: ApiNotification) {
    if (!item.isRead) {
      const updated = items.map(n => n.id === item.id ? { ...n, isRead: true } : n);
      setItems(updated);
      updateBadge(updated);
      markAsRead(item.id).catch(() => {});
    }
  }

  async function handleMarkAllRead() {
    const updated = items.map(n => ({ ...n, isRead: true }));
    setItems(updated);
    updateBadge(updated);
    markAllAsRead().catch(() => {});
  }

  const hasUnread = items.some(n => !n.isRead);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Inbox</Eyebrow>
          <ScreenTitle>Notifications</ScreenTitle>
        </View>
        {hasUnread && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: 14, width: '70%' }}>
            <Btn onPress={() => { setLoading(true); load(); }}>Retry</Btn>
          </View>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centred}>
          <View style={styles.emptyIconBox}>
            <Text style={{ fontSize: 28 }}>🔔</Text>
          </View>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 8 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              {!item.isRead && <View style={styles.unreadDot} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.message}</Text>
                <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  markAllText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12,
    color: Colors.goldLight,
  },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyText: { fontFamily: Fonts.interBold, fontSize: 15, color: Colors.navy },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center' },
  list: { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 12, gap: 8 },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.paper,
  },
  cardUnread: { backgroundColor: Colors.navyPale },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.goldLight, marginTop: 6,
  },
  cardTitle: { fontFamily: Fonts.interBold, fontSize: 13.5, color: Colors.navy, marginBottom: 2 },
  cardBody: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 18 },
  cardTime: { fontFamily: Fonts.inter, fontSize: 10.5, color: Colors.slateSoft, marginTop: 4 },
});