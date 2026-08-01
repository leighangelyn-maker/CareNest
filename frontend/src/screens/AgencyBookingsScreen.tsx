import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookingsByAgency, getServiceCategories } from '../api/bookings';
import { ApiServiceCategory } from '../types';
import { Colors, Fonts, Typography, SCREEN_H_PADDING } from '../theme';

const STATUS_COLORS: Record<string, string> = {
  PENDING_ASSIGNMENT: Colors.warning,
  CONFIRMED:          Colors.success,
  IN_PROGRESS:        Colors.success,
  COMPLETED:          Colors.success,
  CANCELLED:          Colors.danger,
};

const STATUS_BG: Record<string, string> = {
  PENDING_ASSIGNMENT: Colors.warningBg,
  CONFIRMED:          Colors.successBg,
  IN_PROGRESS:        Colors.successBg,
  COMPLETED:          Colors.successBg,
  CANCELLED:          Colors.dangerBg,
};

export default function AgencyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings]     = useState<any[]>([]);
  const [categories, setCategories] = useState<ApiServiceCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const agencyId = await AsyncStorage.getItem('agencyId');
      if (!agencyId) { setBookings([]); return; }
      const [response, cats] = await Promise.all([
        getBookingsByAgency(agencyId),
        categories.length === 0 ? getServiceCategories() : Promise.resolve(categories),
      ]);
      setBookings(response ?? []);
      if (categories.length === 0) setCategories(cats);
    } catch {
      setError('Could not load bookings. Pull to refresh.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categories]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function categoryName(serviceCategoryId: string | undefined): string {
    if (!serviceCategoryId) return 'Service';
    return categories.find(c => c.id === serviceCategoryId)?.name ?? 'Service';
  }

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerLabel}>AGENCY</Text>
      <Text style={styles.headerTitle}>Bookings</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {bookings.length === 0 && !error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            When families book your agency, they'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.navy}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('AgencyBookingDetail', { bookingId: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.serviceText}>
                  {categoryName(item.serviceCategoryId)}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: STATUS_BG[item.status] ?? Colors.navyPale }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? Colors.slate }]}>
                    {item.status?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.dateText}>
                {new Date(item.startTime).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}{' · '}{new Date(item.startTime).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                })}{item.totalHours > 0 ? ` · ${item.totalHours} hrs` : ''}
              </Text>

              {item.status === 'PENDING_ASSIGNMENT' && (
                <TouchableOpacity
                  style={styles.assignButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('AgencyBookingDetail', { bookingId: item.id })}
                >
                  <Text style={styles.assignButtonText}>Assign a worker</Text>
                </TouchableOpacity>
              )}

              {item.workerName && (
                <View style={styles.workerRow}>
                  <View style={styles.workerAvatar}>
                    <Text style={styles.workerAvatarText}>
                      {item.workerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.workerName}>{item.workerName}</Text>
                    {item.hourlyRateMinorUnits > 0 && (
                      <Text style={styles.workerRate}>GHS {(item.hourlyRateMinorUnits / 100).toFixed(2)}/hr</Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.paper },
  header:           { backgroundColor: Colors.navy, paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20, paddingBottom: 24 },
  headerLabel:      { ...Typography.eyebrow, color: Colors.goldLight, letterSpacing: 1.5, marginBottom: 6 },
  headerTitle:      { ...Typography.screenTitle, color: Colors.white, fontSize: 28 },
  errorText:        { ...Typography.bodySmall, color: Colors.danger, textAlign: 'center', marginTop: 20, paddingHorizontal: SCREEN_H_PADDING },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle:       { ...Typography.sectionHeading, color: Colors.navy, marginBottom: 8 },
  emptySub:         { ...Typography.body, color: Colors.slate, textAlign: 'center' },
  listContent:      { padding: SCREEN_H_PADDING, paddingBottom: 40 },
  card:             { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.line },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceText:      { ...Typography.sectionHeading, color: Colors.ink },
  statusPill:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:       { ...Typography.labelSmall, fontFamily: Fonts.interBold },
  dateText:         { ...Typography.bodySmall, color: Colors.slate, marginBottom: 10 },
  assignButton:     { backgroundColor: Colors.navy, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  assignButtonText: { ...Typography.btnLabel, color: Colors.goldLight, fontFamily: Fonts.interBold },
  workerRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.navyPale, borderRadius: 10, padding: 10 },
  workerAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  workerAvatarText: { ...Typography.label, color: Colors.white, fontFamily: Fonts.interBold },
  workerName:       { ...Typography.label, color: Colors.ink, fontFamily: Fonts.interSemiBold },
  workerRate:       { ...Typography.meta, color: Colors.slate, marginTop: 2 },
});