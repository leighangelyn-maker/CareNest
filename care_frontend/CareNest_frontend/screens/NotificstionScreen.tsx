import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

const TYPE_LABELS: Record<string, string> = {
  NEW_BOOKING_REQUEST: 'New Booking Request',
  PRICE_SET: 'Price Set',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  WORKER_ASSIGNED: 'Worker Assigned',
  BOOKING_CANCELLED: 'Booking Cancelled',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await getNotifications();
      const list = response.data ?? response ?? [];
      const sorted = [...list].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePress = async (item: any) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // Non-fatal
      }
    }
    if (item.bookingId) {
      navigation.navigate('BookingHistory');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Non-fatal
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#C62828" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#C62828" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => handlePress(item)}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
                {!item.isRead && <View style={styles.dot} />}
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  backText:       { color: '#0D1B2A', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  titleRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:          { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  markAllText:    { color: '#0D1B2A', fontSize: 13, fontWeight: '600' },
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyText:      { color: '#999', fontSize: 14 },
  listContent:    { paddingHorizontal: 20, paddingBottom: 40 },
  card:           { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardUnread:     { borderColor: '#0D1B2A' },
  cardHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType:       { color: '#0D1B2A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0D1B2A' },
  cardTitle:      { color: '#1A1A1A', fontSize: 15, fontWeight: '600', marginTop: 6 },
  cardMessage:    { color: '#666666', fontSize: 13, marginTop: 4, lineHeight: 18 },
  cardTime:       { color: '#999', fontSize: 11, marginTop: 6 },
});