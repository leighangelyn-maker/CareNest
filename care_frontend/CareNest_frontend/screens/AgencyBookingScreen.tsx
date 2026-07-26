import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookingsByAgency } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING_ASSIGNMENT: '#C68A00',
  CONFIRMED: '#00BCD4',
  IN_PROGRESS: '#00BCD4',
  COMPLETED: '#4CAF50',
  CANCELLED: '#FF6B6B',
};

export default function AgencyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      if (!agencyId) { setBookings([]); return; }
      const response = await getBookingsByAgency(agencyId);
      setBookings(response.data ?? response ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#00BCD4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AgencyHomeMain')}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bookings</Text>
      </View>

      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet.</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00BCD4" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AgencyBookingDetail', { bookingId: item.id })}>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(item.startTime).toLocaleString()}</Text>
              {item.workerName && <Text style={styles.workerText}>Worker: {item.workerName}</Text>}
              {item.totalHours > 0 && <Text style={styles.metaText}>{item.totalHours} hrs</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A1F44' },
  header:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  backText:     { color: '#00BCD4', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  title:        { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  empty:        { color: '#888', textAlign: 'center', marginTop: 40 },
  listContent:  { paddingHorizontal: 20, paddingBottom: 40 },
  card:         { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 14 },
  statusPill:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  statusText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  dateText:     { color: '#B8C4DB', fontSize: 13 },
  workerText:   { color: '#fff', fontSize: 13, marginTop: 4 },
  metaText:     { color: '#888', fontSize: 12, marginTop: 4 },
});