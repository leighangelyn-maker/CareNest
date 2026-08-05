import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, MainTabParamList, ApiServiceCategory } from '../types';
import apiClient from '../api/client';
import { getBookingsByAgency, getServiceCategories, updateBookingStatus } from '../api/bookings';
import { Eyebrow, ScreenTitle, Divider } from '../components/atoms';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalWorkers: number;
  pendingPayouts: number;
  totalRevenueMinorUnits: number;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_ASSIGNMENT: Colors.gold,
  ASSIGNED: Colors.assigned,
  IN_PROGRESS: Colors.navy,
  COMPLETED: Colors.success,
  CANCELLED: Colors.slate,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ASSIGNMENT: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const ZERO_STATS: DashStats = {
  totalBookings: 0,
  activeBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  totalWorkers: 0,
  pendingPayouts: 0,
  totalRevenueMinorUnits: 0,
};

function formatGhs(minor: number) {
  return `GHS ${(minor / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, color ? { color } : null]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.navyPale,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minWidth: (SCREEN_WIDTH - SCREEN_H_PADDING * 2 - 10) / 2,
    borderWidth: 1,
    borderColor: Colors.line,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  value: { fontFamily: Fonts.interBold, fontSize: 22, color: Colors.navy, marginBottom: 2 },
  label: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slate, textAlign: 'center' },
});

export default function AgencyDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashStats>(ZERO_STATS);
  const [bookings, setBookings] = useState<any[]>([]);
  const [categories, setCategories] = useState<ApiServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'bookings' | 'revenue'>('bookings');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      if (!agencyId) { setLoading(false); return; }

      const [dashRes, bookList, cats] = await Promise.allSettled([
        apiClient.get(`/agencies/${agencyId}/dashboard`),
        getBookingsByAgency(agencyId),
        categories.length === 0 ? getServiceCategories() : Promise.resolve(categories),
      ]);
      if (dashRes.status === 'fulfilled') {
        setStats((dashRes.value as any).data?.data ?? (dashRes.value as any).data ?? ZERO_STATS);
      }
      if (bookList.status === 'fulfilled') {
        setBookings((bookList as any).value ?? []);
      }
      if (cats.status === 'fulfilled' && categories.length === 0) {
        setCategories((cats as any).value ?? []);
      }
    } catch {}
    if (!silent) setLoading(false);
  }, [categories]);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  function categoryName(serviceCategoryId: string | undefined): string {
    if (!serviceCategoryId) return 'Service';
    return categories.find(c => c.id === serviceCategoryId)?.name ?? 'Service';
  }

  function handleAssign(bookingId: string) {
    navigation.navigate('AgencyBookingDetail', { bookingId });
  }

  async function handleComplete(bookingId: string) {
    try {
      await updateBookingStatus(bookingId, 'COMPLETED');
      load(true);
    } catch {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 80 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }}
            colors={[Colors.navy]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.8">
              <Path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.headerText}>
            <Eyebrow>Agency Dashboard</Eyebrow>
            <ScreenTitle size={20}>My Agency</ScreenTitle>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard label="Total Bookings" value={stats.totalBookings} />
            <View style={{ width: 10 }} />
            <StatCard label="Active Now" value={stats.activeBookings} color={Colors.navy} />
          </View>
          <View style={[styles.statsRow, { marginTop: 10 }]}>
            <StatCard label="Completed" value={stats.completedBookings} color={Colors.success} />
            <View style={{ width: 10 }} />
            <StatCard label="Workers" value={stats.totalWorkers} />
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue (net of 7% fee)</Text>
            <Text style={styles.revenueValue}>
              {formatGhs(Math.round(stats.totalRevenueMinorUnits * 0.93))}
            </Text>
            <Text style={styles.revenueNote}>
              Platform fee (7%): {formatGhs(Math.round(stats.totalRevenueMinorUnits * 0.07))}
            </Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'bookings' && styles.tabBtnActive]}
            onPress={() => setTab('bookings')}
          >
            <Text style={[styles.tabText, tab === 'bookings' && styles.tabTextActive]}>
              Bookings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'revenue' && styles.tabBtnActive]}
            onPress={() => setTab('revenue')}
          >
            <Text style={[styles.tabText, tab === 'revenue' && styles.tabTextActive]}>
              Revenue
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : tab === 'bookings' ? (
          <>
            {bookings.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconBox}>
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={Colors.slateSoft} strokeWidth="1.6" strokeLinecap="round">
                    <Rect x="3" y="5" width="18" height="16" rx="2" />
                    <Path d="M8 3v4M16 3v4M3 10h18" />
                  </Svg>
                </View>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptyBody}>Bookings from families will appear here once submitted.</Text>
              </View>
            ) : (
              bookings.map(b => (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <Text style={styles.bookingCategory}>{categoryName(b.serviceCategoryId)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[b.status] ?? Colors.slate}22` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] ?? Colors.slate }]}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bookingTime}>
                    {formatDate(b.startTime)} → {formatDate(b.endTime)}
                  </Text>
                  {b.familyNotes ? (
                    <Text style={styles.bookingNotes}>"{b.familyNotes}"</Text>
                  ) : null}
                  {b.agencyPayoutMinorUnits ? (
                    <Text style={styles.bookingPayout}>
                      Payout: {formatGhs(b.agencyPayoutMinorUnits)}
                    </Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    {b.status === 'PENDING_ASSIGNMENT' && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleAssign(b.id)}
                      >
                        <Text style={styles.actionBtnText}>Assign a worker</Text>
                      </TouchableOpacity>
                    )}
                    {b.status === 'IN_PROGRESS' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => handleComplete(b.id)}
                      >
                        <Text style={styles.actionBtnText}>Mark Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          stats.totalRevenueMinorUnits === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={Colors.slateSoft} strokeWidth="1.6" strokeLinecap="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M12 7v5l3 3" />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>No revenue yet</Text>
              <Text style={styles.emptyBody}>
                Revenue from completed bookings will appear here.
              </Text>
            </View>
          ) : (
          <View style={styles.revenueSection}>
            <View style={styles.revRow}>
              <Text style={styles.revLabel}>Gross revenue</Text>
              <Text style={styles.revValue}>{formatGhs(stats.totalRevenueMinorUnits)}</Text>
            </View>
            <Divider />
            <View style={styles.revRow}>
              <Text style={styles.revLabel}>CareNest platform fee (7%)</Text>
              <Text style={[styles.revValue, { color: Colors.danger }]}>
                − {formatGhs(Math.round(stats.totalRevenueMinorUnits * 0.07))}
              </Text>
            </View>
            <Divider />
            <View style={styles.revRow}>
              <Text style={[styles.revLabel, { fontFamily: Fonts.interBold }]}>Net to agency</Text>
              <Text style={[styles.revValue, { color: Colors.success, fontFamily: Fonts.interBold }]}>
                {formatGhs(Math.round(stats.totalRevenueMinorUnits * 0.93))}
              </Text>
            </View>
            <Divider />
            <View style={styles.revRow}>
              <Text style={styles.revLabel}>Pending payouts</Text>
              <Text style={styles.revValue}>{stats.pendingPayouts}</Text>
            </View>
          </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { padding: SCREEN_H_PADDING, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.goldTintRing,
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  statsGrid: { marginBottom: 18 },
  statsRow: { flexDirection: 'row' },
  revenueCard: {
    marginTop: 10, backgroundColor: Colors.navy, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  revenueLabel: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.paperFaint, marginBottom: 4 },
  revenueValue: { fontFamily: Fonts.interBold, fontSize: 26, color: Colors.goldLight, marginBottom: 4 },
  revenueNote: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.paperDim },
  tabRow: {
    flexDirection: 'row', marginBottom: 14,
    backgroundColor: Colors.navyPale, borderRadius: 10, padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: Colors.navy },
  tabText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.slateSoft },
  tabTextActive: { color: Colors.goldLight },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.navyPale,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1, borderColor: Colors.line,
  },
  emptyTitle: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 4 },
  emptyBody: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, textAlign: 'center', lineHeight: 20 },
  bookingCard: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 16,
    padding: 14, marginBottom: 10,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 2,
  },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingCategory: { fontFamily: Fonts.interBold, fontSize: 15, color: Colors.navy },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  statusText: { fontFamily: Fonts.interBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  bookingTime: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slate, marginBottom: 4 },
  bookingNotes: {
    fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft,
    fontStyle: 'italic', marginBottom: 6,
  },
  bookingPayout: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.success, marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: Colors.navy, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  actionBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.goldLight },
  revenueSection: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 16, padding: 16,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
    elevation: 2,
  },
  revRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  revLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate },
  revValue: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.navy },
});