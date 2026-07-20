import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, FlatList
} from 'react-native';

type Booking = {
  id: string;
  service: string;
  agency: string;
  date: string;
  time: string;
  address: string;
  amount: number;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  worker?: string;
  rated: boolean;
};

const dummyBookings: Booking[] = [
  {
    id: '1',
    service: 'Nanny',
    agency: 'Comfort Home Services',
    date: '2026-07-01',
    time: '08:00',
    address: 'East Legon, Accra',
    amount: 200,
    status: 'completed',
    worker: 'Yaa Dufie',
    rated: false,
  },
  {
    id: '2',
    service: 'Cleaner',
    agency: 'Comfort Home Services',
    date: '2026-07-05',
    time: '09:00',
    address: 'East Legon, Accra',
    amount: 150,
    status: 'assigned',
    worker: 'Abena Mensah',
    rated: false,
  },
  {
    id: '3',
    service: 'Cook',
    agency: 'Comfort Home Services',
    date: '2026-07-10',
    time: '10:00',
    address: 'East Legon, Accra',
    amount: 180,
    status: 'pending',
    rated: false,
  },
];

export default function BookingHistoryScreen({ navigation }: any) {
  const [bookings] = useState<Booking[]>(dummyBookings);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');

  const filtered = bookings.filter(b => filter === 'all' ? true : b.status === filter);

  const statusColor = (status: string) => {
    if (status === 'pending')   return '#FFA500';
    if (status === 'assigned')  return '#00BCD4';
    if (status === 'completed') return '#4CAF50';
    return '#FF5252';
  };

  const statusIcon = (status: string) => {
    if (status === 'pending')   return '⏳';
    if (status === 'assigned')  return '👷';
    if (status === 'completed') return '✅';
    return '❌';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'assigned', 'completed'] as const).map((f) => (
          <TouchableOpacity key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceIcon}>
                  {item.service === 'Nanny' ? '👶' : item.service === 'Cleaner' ? '🧹' : '👨‍🍳'}
                </Text>
                <Text style={styles.serviceName}>{item.service}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(item.status) }]}>
                {statusIcon(item.status)} {item.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.detail}>🏢 {item.agency}</Text>
            <Text style={styles.detail}>📅 {item.date} at {item.time}</Text>
            <Text style={styles.detail}>📍 {item.address}</Text>
            <Text style={styles.detail}>💰 GHS {item.amount.toFixed(2)}</Text>

            {item.worker && (
              <Text style={styles.workerText}>👷 Worker: {item.worker}</Text>
            )}

            {item.status === 'completed' && !item.rated && (
              <TouchableOpacity style={styles.rateBtn}
                onPress={() => navigation.navigate('Rating', { booking: item })}>
                <Text style={styles.rateBtnText}>⭐ Rate this Service</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0A1F44' },
  header:          { padding: 24, paddingBottom: 8 },
  title:           { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  filterRow:       { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  filterChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#00BCD4' },
  filterChipActive:{ backgroundColor: '#00BCD4' },
  filterText:      { color: '#00BCD4', fontSize: 12 },
  filterTextActive:{ color: '#fff' },
  list:            { paddingHorizontal: 24, paddingBottom: 48 },
  card:            { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  serviceRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceIcon:     { fontSize: 24 },
  serviceName:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  status:          { fontSize: 12, fontWeight: 'bold' },
  detail:          { color: '#aaa', fontSize: 14, marginBottom: 4 },
  workerText:      { color: '#00BCD4', fontSize: 14, marginTop: 8 },
  rateBtn:         { backgroundColor: '#0A1F44', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  rateBtnText:     { color: '#FFD700', fontWeight: 'bold' },
  empty:           { alignItems: 'center', marginTop: 64 },
  emptyIcon:       { fontSize: 48, marginBottom: 16 },
  emptyText:       { color: '#888', fontSize: 16 },
});