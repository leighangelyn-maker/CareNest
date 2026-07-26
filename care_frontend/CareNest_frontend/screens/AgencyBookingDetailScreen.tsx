import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookingById, assignWorkerToBooking, getWorkersByAgency } from '../services/api';

export default function AgencyBookingDetailScreen({ route, navigation }: any) {
  const bookingId: string = route.params?.bookingId;

  const [booking, setBooking] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      const [bookingRes, workersRes] = await Promise.all([
        getBookingById(bookingId),
        agencyId ? getWorkersByAgency(agencyId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const bookingData = bookingRes.data ?? bookingRes;
      setBooking(bookingData);
      setSelectedWorkerId(bookingData.workerId ?? null);
      setWorkers(workersRes.data ?? workersRes ?? []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load this booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const handleAssign = async () => {
    if (!selectedWorkerId) {
      Alert.alert('Select a worker', 'Choose who should be assigned to this booking.');
      return;
    }
    setAssigning(true);
    try {
      await assignWorkerToBooking(bookingId, selectedWorkerId);
      Alert.alert('Worker Assigned', 'The client will be notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not assign worker.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#00BCD4" />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.error}>Booking not found.</Text>
        </View>
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
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Booking Details</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>STATUS</Text>
          <Text style={styles.infoValue}>{booking.status}</Text>

          <Text style={styles.infoLabel}>START TIME</Text>
          <Text style={styles.infoValue}>{new Date(booking.startTime).toLocaleString()}</Text>

          {booking.totalHours > 0 && (
            <>
              <Text style={styles.infoLabel}>HOURS</Text>
              <Text style={styles.infoValue}>{booking.totalHours}</Text>
            </>
          )}

          {!!booking.familyNotes && (
            <>
              <Text style={styles.infoLabel}>FAMILY NOTES</Text>
              <Text style={styles.infoValue}>{booking.familyNotes}</Text>
            </>
          )}

          {booking.workerName && (
            <>
              <Text style={styles.infoLabel}>CURRENTLY ASSIGNED</Text>
              <Text style={styles.infoValue}>{booking.workerName}</Text>
            </>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Assign a Worker</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddWorker')}>
            <Text style={styles.addWorkerLink}>+ Add Worker</Text>
          </TouchableOpacity>
        </View>

        {workers.length === 0 ? (
          <Text style={styles.empty}>No workers on your team yet. Tap "+ Add Worker" above.</Text>
        ) : (
          workers.map((w: any) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.workerCard, selectedWorkerId === w.id && styles.workerCardActive]}
              onPress={() => setSelectedWorkerId(w.id)}>
              <Text style={styles.workerName}>{w.fullName}</Text>
              <Text style={styles.workerMeta}>
                {w.serviceCategoryName} · GHS {(w.defaultHourlyRateMinorUnits / 100).toFixed(2)}/hr · {w.status}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={[styles.button, assigning && styles.buttonDisabled]}
          onPress={handleAssign}
          disabled={assigning}>
          {assigning
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Assign Worker</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0A1F44' },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error:           { color: '#FF6B6B' },
  header:          { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backText:        { color: '#00BCD4', fontSize: 15, fontWeight: '600' },
  scroll:          { padding: 20, paddingTop: 0, paddingBottom: 60 },
  title:           { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  infoCard:        { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16 },
  infoLabel:       { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 10 },
  infoValue:       { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  sectionHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 },
  sectionTitle:    { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  addWorkerLink:   { color: '#00BCD4', fontSize: 13, fontWeight: '600' },
  empty:           { color: '#888', fontSize: 13 },
  workerCard:      { backgroundColor: '#1C2E4A', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  workerCardActive:{ borderColor: '#00BCD4' },
  workerName:      { color: '#fff', fontSize: 14, fontWeight: '600' },
  workerMeta:      { color: '#888', fontSize: 12, marginTop: 2 },
  button:          { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled:  { opacity: 0.5 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});