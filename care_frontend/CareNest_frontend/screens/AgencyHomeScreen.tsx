import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';

type Booking = {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: 'pending' | 'assigned' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  worker?: string;
};

const dummyBookings: Booking[] = [
  { id: '1', client: 'Ama Mensah',  service: 'Nanny',   date: '2026-07-01', time: '08:00', address: 'East Legon, Accra', status: 'pending',  paymentStatus: 'paid' },
  { id: '2', client: 'Kofi Asante', service: 'Cleaner', date: '2026-07-02', time: '09:00', address: 'Tema, Accra',       status: 'pending',  paymentStatus: 'unpaid' },
  { id: '3', client: 'Abena Owusu', service: 'Cook',    date: '2026-07-03', time: '10:00', address: 'Kumasi',            status: 'assigned', paymentStatus: 'paid', worker: 'Yaa Dufie' },
];

export default function AgencyHomeScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>(dummyBookings);

  const handleAssign = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking?.paymentStatus === 'unpaid') {
      Alert.alert('Payment Pending', 'Client has not paid yet. You can only assign a worker after payment is confirmed.');
      return;
    }
    Alert.prompt(
      'Assign Worker',
      'Enter worker name:',
      (workerName) => {
        if (!workerName) return;
        setBookings(prev =>
          prev.map(b => b.id === id
            ? { ...b, status: 'assigned', worker: workerName }
            : b
          )
        );
        Alert.alert('✅ Assigned', `Worker "${workerName}" assigned successfully!`);
      }
    );
  };

  const statusColor = (status: string) => {
    if (status === 'pending')  return '#FFA500';
    if (status === 'assigned') return '#00BCD4';
    return '#4CAF50';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏢 Agency Dashboard</Text>
        <Text style={styles.subtitle}>Incoming Bookings</Text>

        {bookings.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.clientName}>{b.client}</Text>
              <Text style={[styles.status, { color: statusColor(b.status) }]}>
                {b.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.detail}>🛠 {b.service}</Text>
            <Text style={styles.detail}>📅 {b.date} at {b.time}</Text>
            <Text style={styles.detail}>📍 {b.address}</Text>

            {/* Payment Status */}
            <View style={[styles.paymentBadge,
              { backgroundColor: b.paymentStatus === 'paid' ? '#1a3a1a' : '#3a1a1a' }]}>
              <Text style={[styles.paymentText,
                { color: b.paymentStatus === 'paid' ? '#4CAF50' : '#FF5252' }]}>
                {b.paymentStatus === 'paid' ? '✅ Payment Confirmed' : '⏳ Payment Pending'}
              </Text>
            </View>

            {b.worker && (
              <Text style={styles.workerText}>👷 Assigned: {b.worker}</Text>
            )}

            {b.status === 'pending' && (
              <TouchableOpacity
                style={[styles.assignBtn,
                  b.paymentStatus === 'unpaid' && styles.assignBtnDisabled]}
                onPress={() => handleAssign(b.id)}>
                <Text style={styles.assignBtnText}>
                  {b.paymentStatus === 'paid' ? 'Assign Worker' : 'Awaiting Payment'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0A1F44' },
  scroll:           { padding: 24, paddingBottom: 80 },
  title:            { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle:         { color: '#888', fontSize: 15, marginBottom: 24 },
  card:             { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  clientName:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  status:           { fontSize: 12, fontWeight: 'bold' },
  detail:           { color: '#aaa', fontSize: 14, marginBottom: 4 },
  paymentBadge:     { borderRadius: 8, padding: 8, marginTop: 8, marginBottom: 4, alignItems: 'center' },
  paymentText:      { fontSize: 13, fontWeight: 'bold' },
  workerText:       { color: '#00BCD4', fontSize: 14, marginTop: 8 },
  assignBtn:        { backgroundColor: '#00BCD4', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  assignBtnDisabled:{ backgroundColor: '#2E4060' },
  assignBtnText:    { color: '#fff', fontWeight: 'bold' },
  logoutBtn:        { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#1C2E4A', padding: 12, borderRadius: 10 },
  logoutText:       { color: '#00BCD4', fontWeight: 'bold' },
});