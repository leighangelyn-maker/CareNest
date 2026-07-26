import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadNotificationCount } from '../services/api';

const BASE_URL = 'https://carenest-2k59.onrender.com';

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchDashboard(agencyId: string) {
  const res = await fetch(`${BASE_URL}/agencies/${agencyId}/dashboard`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  const json = await res.json();
  return json.data ?? json;
}

async function fetchRevenue(agencyId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // last 12 months

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const res = await fetch(
    `${BASE_URL}/agencies/${agencyId}/dashboard/revenue?${params.toString()}`,
    { headers: await authHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to load revenue (${res.status})`);
  const json = await res.json();
  return json.data ?? json;
}
async function fetchPendingDocs(agencyId: string) {
  const res = await fetch(`${BASE_URL}/documents/agency/${agencyId}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
  const json = await res.json();
  return json.data ?? json;
}

export default function AgencyHomeScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const agencyId = await AsyncStorage.getItem('agencyId');
        if (!agencyId) throw new Error('No agency ID found — check what key is saved at login');

        const [d, r, docs] = await Promise.all([
          fetchDashboard(agencyId),
          fetchRevenue(agencyId),
          fetchPendingDocs(agencyId),
        ]);
        if (!cancelled) {
          setDashboard(d);
          setRevenue(r);
          setDocuments(docs ?? []);
        }

        getUnreadNotificationCount()
          .then((res) => { if (!cancelled) setUnreadCount(res.data ?? res ?? 0); })
          .catch(() => {});
      } catch (err: any) {
        if (!cancelled) Alert.alert('Error', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#00BCD4" size="large" />
      </SafeAreaView>
    );
  }

  const isVerified = documents.every((d: any) => d.status === 'VERIFIED' || d.verified === true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Agency Dashboard</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellButton}>
            <Text style={styles.bellIcon}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!isVerified && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Some verification documents are still pending. Families may not see your full profile until this is complete.
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard?.totalBookings ?? '—'}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard?.averageRating ?? '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue</Text>
          <Text style={styles.revenueValue}>GHS {revenue?.totalRevenue?.toFixed?.(2) ?? '0.00'}</Text>
          {revenue?.breakdown?.map((b: any, i: number) => (
            <View key={i} style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>{b.period ?? b.label}</Text>
              <Text style={styles.revenueAmount}>GHS {b.amount?.toFixed?.(2) ?? b.amount}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AgencyBookings')}>
          <Text style={styles.actionText}>View Bookings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  centered:       { justifyContent: 'center', alignItems: 'center' },
  scroll:         { padding: 24, paddingBottom: 48 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting:       { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  bellButton:     { position: 'relative', paddingTop: 4 },
  bellIcon:       { color: '#00BCD4', fontSize: 13, fontWeight: '600' },
  badge:          { position: 'absolute', top: -6, right: -10, backgroundColor: '#FF6B6B', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:      { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  warningCard:    { backgroundColor: '#3A2A0A', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FFA500' },
  warningText:    { color: '#FFA500', fontSize: 13 },
  statsRow:       { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard:       { flex: 1, backgroundColor: '#1C2E4A', borderRadius: 14, padding: 18, alignItems: 'center' },
  statValue:      { color: '#00BCD4', fontSize: 26, fontWeight: 'bold' },
  statLabel:      { color: '#888', fontSize: 12, marginTop: 4 },
  card:           { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 18, marginBottom: 20 },
  cardTitle:      { color: '#00BCD4', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  revenueValue:   { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  revenueRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  revenueLabel:   { color: '#888', fontSize: 13 },
  revenueAmount:  { color: '#fff', fontSize: 13 },
  actionBtn:      { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 12 },
  actionText:     { color: '#00BCD4', fontSize: 15, fontWeight: 'bold' },
});