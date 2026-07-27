/**
 * AgencyDashboardScreen — shown to AGENCY_ADMIN users after login.
 * Mirrors the client experience: shows bookings assigned to this agency,
 * revenue summary, and a worker/booking management view.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import { Eyebrow, ScreenTitle, Divider } from '../components/atoms';
import CareNestLogo from '../components/CareNestLogo';
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

interface AgencyBooking {
  id: string;
  status: string;
  category: string;
  startTime: string;
  endTime: string;
  familyNotes?: string;
  agencyPayoutMinorUnits?: number;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_ASSIGNMENT: Colors.gold,
  ASSIGNED: '#3a6ea8',
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

// Mock dashboard data for when API isn't ready
const MOCK_STATS: DashStats = {
  totalBookings: 24,
  activeBookings: 3,
  completedBookings: 19,
  cancelledBookings: 2,
  totalWorkers: 8,
  pendingPayouts: 2,
  totalRevenueMinorUnits: 345000,
};

const MOCK_BOOKINGS: AgencyBooking[] = [
  {
    id: 'ab-001', status: 'PENDING_ASSIGNMENT', category: 'Nanny',
    startTime: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 3600000 + 8 * 3600000).toISOString(),
    familyNotes: 'Please arrive by 8am.', agencyPayoutMinorUnits: 23250,
  },
  {
    id: 'ab-002', status: 'ASSIGNED', category: 'Cleaner',
    startTime: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 1 * 24 * 3600000 + 4 * 3600000).toISOString(),
    agencyPayoutMinorUnits: 12540,
  },
  {
    id: 'ab-003', status: 'COMPLETED', category: 'Cook',
    startTime: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 3600000 + 5 * 3600000).toISOString(),
    agencyPayoutMinorUnits: 18600,
  },
];

function formatGhs(minor: number) {
  return `GHS ${(minor / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
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
    flex: 1, backgroundColor: Colors.navyPale, borderRadius: 12,
    padding: 12, alignItems: 'center', minWidth: (SCREEN_WIDTH - SCREEN_H_PADDING * 2 - 10) / 2,
  },
  value: { fontFamily: Fonts.interBold, fontSize: 22, color: Colors.navy, marginBottom: 2 },
  label: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slate, textAlign: 'center' },
});

export default function AgencyDashboardScreen({ navigation }: Props) {
  const { name, id: agencyId } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashStats>(MOCK_STATS);
  const [bookings, setBookings] = useState<AgencyBooking[]>(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'bookings' | 'revenue'>('bookings');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Try agency dashboard endpoint
      const [dashRes, bookRes] = await Promise.allSettled([
        apiClient.get(`/agencies/${agencyId}/dashboard`),
        apiClient.get('/bookings'),
      ]);
      if (dashRes.status === 'fulfilled') {
        setStats(dashRes.value.data?.data ?? dashRes.value.data ?? MOCK_STATS);
      }
      if (bookRes.status === 'fulfilled') {
        const raw = bookRes.value.data;
        const arr = Array.isArray(raw) ? raw
          : Array.isArray(raw?.page?.data) ? raw.page.data
          : Array.isArray(raw?.data) ? raw.data : [];
        if (arr.length > 0) setBookings(arr);
      }
    } catch {}
    if (!silent) setLoading(false);
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  async function handleAssign(bookingId: string) {
    try {
      await apiClient.patch(`/bookings/${bookingId}/assign-worker`, { workerId: null });
      load(true);
    } catch {}
  }

  async function handleComplete(bookingId: string) {
    try {
      await apiClient.patch(`/bookings/${bookingId}/complete`);
      load(true);
    } catch {
      // Update locally
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED' } : b)
      );
    }
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
        {/* Header */}
        <View style={styles.header}>
          <CareNestLogo size={40} />
          <View style={styles.headerText}>
            <Eyebrow>Agency Dashboard</Eyebrow>
            <ScreenTitle size={20}>{name ?? 'My Agency'}</ScreenTitle>
          </View>
        </View>

        {/* Stats grid */}
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

        {/* Tab switcher */}
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
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptyBody}>Bookings from families will appear here once submitted.</Text>
              </View>
            ) : (
              bookings.map(b => (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <Text style={styles.bookingCategory}>{b.category}</Text>
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
                      Payout: {formatGhs(Math.round(b.agencyPayoutMinorUnits * 0.93))} (after 7% fee)
                    </Text>
                  ) : null}

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    {b.status === 'PENDING_ASSIGNMENT' && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleAssign(b.id)}
                      >
                        <Text style={styles.actionBtnText}>Mark Assigned</Text>
                      </TouchableOpacity>
                    )}
                    {(b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS') && (
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
          /* Revenue tab */
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { padding: SCREEN_H_PADDING, paddingTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerText: { flex: 1 },
  statsGrid: { marginBottom: 18 },
  statsRow: { flexDirection: 'row' },
  revenueCard: {
    marginTop: 10, backgroundColor: Colors.navy, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  revenueLabel: { fontFamily: Fonts.inter, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  revenueValue: { fontFamily: Fonts.interBold, fontSize: 26, color: Colors.goldLight, marginBottom: 4 },
  revenueNote: { fontFamily: Fonts.inter, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  tabRow: {
    flexDirection: 'row', marginBottom: 14,
    backgroundColor: Colors.navyPale, borderRadius: 10, padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: Colors.navy },
  tabText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.slateSoft },
  tabTextActive: { color: Colors.goldLight },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 4 },
  emptyBody: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, textAlign: 'center', lineHeight: 20 },
  bookingCard: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 14,
    padding: 14, marginBottom: 10,
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
    borderWidth: 1, borderColor: Colors.line, borderRadius: 14, padding: 16,
  },
  revRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  revLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate },
  revValue: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.navy },
});
