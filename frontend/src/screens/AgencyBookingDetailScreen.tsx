import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, ApiBooking, ApiAgencyWorker, BookingStatus } from '../types';
import { getBooking, assignWorkerToBooking } from '../api/bookings';
import { getWorkersForAgency } from '../api/workers';
import { BackBtn, Btn, Divider, Eyebrow, Row, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgencyBookingDetail'>;

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_ASSIGNMENT': return 'Pending';
    case 'ASSIGNED':           return 'Assigned';
    case 'IN_PROGRESS':        return 'In Progress';
    case 'COMPLETED':          return 'Completed';
    case 'CANCELLED':          return 'Cancelled';
  }
}

function statusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_ASSIGNMENT':
    case 'ASSIGNED':    return Colors.gold;
    case 'IN_PROGRESS': return Colors.navy;
    case 'COMPLETED':   return Colors.success;
    case 'CANCELLED':   return Colors.danger;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

export default function AgencyBookingDetailScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [workers, setWorkers] = useState<ApiAgencyWorker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const b = await getBooking(bookingId);
      setBooking(b);

      const agencyId = await AsyncStorage.getItem('agencyId');
      if (agencyId) {
        const w = await getWorkersForAgency(agencyId);
        const relevant = w.filter(
          worker => !b.serviceCategoryId || worker.serviceCategoryId === b.serviceCategoryId
        );
        setWorkers(relevant.length > 0 ? relevant : w);
        setSelectedWorkerId(b.workerId ?? null);
      }
    } catch (e: any) {
      setLoadError('Could not load this booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAssign() {
    if (!selectedWorkerId) {
      setAssignError('Select a worker to assign.');
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      const refreshed = await assignWorkerToBooking(bookingId, selectedWorkerId);
      setBooking(refreshed);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to assign worker.';
      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackBtn onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centre}>
          <Text style={styles.errorText}>{loadError ?? 'Booking not found.'}</Text>
          <Btn variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            Go back
          </Btn>
        </View>
      </SafeAreaView>
    );
  }

  const b = booking;
  const alreadyAssigned = b.status !== 'PENDING_ASSIGNMENT';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Booking detail</Eyebrow>
        <ScreenTitle>Assign worker</ScreenTitle>
        <View style={styles.headerMeta}>
          <Sub>Booking #{b.id.slice(0, 8)}</Sub>
          <View style={[styles.statusPill, {
            backgroundColor: statusColor(b.status) + '22',
            borderColor: statusColor(b.status) + '44',
          }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(b.status) }]} />
            <Text style={[styles.statusPillText, { color: statusColor(b.status) }]}>
              {statusLabel(b.status)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: SCREEN_H_PADDING }}>
        <Row label="Start" value={formatDate(b.startTime)} />
        <Divider />
        <Row label="End" value={formatDate(b.endTime)} />
        {b.totalHours ? (
          <>
            <Divider />
            <Row label="Duration" value={`${b.totalHours} hr${b.totalHours !== 1 ? 's' : ''}`} />
          </>
        ) : null}
        {b.familyNotes ? (
          <>
            <Divider />
            <Row label="Family notes" value={b.familyNotes} />
          </>
        ) : null}

        <Text style={styles.sectionLabel}>
          {alreadyAssigned ? 'Assigned worker' : 'Select a worker'}
        </Text>

        {workers.length === 0 ? (
          <View>
            <Text style={styles.emptyHint}>
              No workers found for your agency yet.
            </Text>
            <TouchableOpacity
              style={styles.addWorkerBtn}
              onPress={() => navigation.navigate('AddWorker')}
              activeOpacity={0.75}
            >
              <Text style={styles.addWorkerBtnText}>+ Add a worker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {workers.map((w) => {
              const selected = w.id === selectedWorkerId;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.workerCard, selected && styles.workerCardSelected]}
                  onPress={() => !alreadyAssigned && setSelectedWorkerId(w.id)}
                  activeOpacity={alreadyAssigned ? 1 : 0.75}
                  disabled={alreadyAssigned}
                >
                  <Text style={[styles.workerName, selected && styles.workerNameSelected]}>
                    {w.fullName}
                  </Text>
                  <Text style={styles.workerMeta}>
                    {w.serviceCategoryName}
                    {w.defaultHourlyRateMinorUnits > 0
                      ? ` · GHS ${(w.defaultHourlyRateMinorUnits / 100).toFixed(2)}/hr`
                      : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {assignError ? <Text style={styles.inlineError}>{assignError}</Text> : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      {!alreadyAssigned && workers.length > 0 && (
        <View style={styles.actions}>
          {assigning ? (
            <View style={styles.loadingBtn}>
              <ActivityIndicator color={Colors.goldLight} />
            </View>
          ) : (
            <Btn onPress={handleAssign}>Assign worker</Btn>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 8, paddingBottom: 10 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: Fonts.interSemiBold, fontSize: 11.5 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_H_PADDING },
  errorText: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.danger, textAlign: 'center' },
  sectionLabel: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 11, letterSpacing: 1,
    textTransform: 'uppercase', color: Colors.slateSoft,
    marginTop: 20, marginBottom: 10,
  },
  emptyHint: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 18 },
  addWorkerBtn: {
    marginTop: 10, borderWidth: 1.5, borderColor: Colors.navy, borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  addWorkerBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
  workerCard: {
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 11, backgroundColor: Colors.paper,
  },
  workerCardSelected: { borderColor: Colors.navy, backgroundColor: Colors.navyPale },
  workerName: { fontFamily: Fonts.interSemiBold, fontSize: 13.5, color: Colors.slate },
  workerNameSelected: { color: Colors.navy },
  workerMeta: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft, marginTop: 2 },
  inlineError: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.danger, marginTop: 12, textAlign: 'center' },
  actions: {
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.paper,
  },
  loadingBtn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', opacity: 0.8,
  },
});