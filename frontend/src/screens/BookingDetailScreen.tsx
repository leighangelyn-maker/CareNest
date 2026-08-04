import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ApiBooking, BookingStatus, ApiServiceCategory } from '../types';
import { getBooking, getServiceCategories } from '../api/bookings';
import { getAgency } from '../api/agencies';
import { useBookings } from '../BookingContext';
import { BackBtn, Btn, Divider, Eyebrow, Row, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

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

export default function BookingDetailScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const { bookings, cancelBooking } = useBookings();

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [agencyName, setAgencyName] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function loadBooking() {
    const fromContext = bookings.find(b => b.id === bookingId);
    if (fromContext) {
      setBooking(fromContext);
      setAgencyName((fromContext as any).agencyName ?? '');
      setCategoryName((fromContext as any).categoryName ?? '');
      if ((fromContext as any).agencyName && (fromContext as any).categoryName) return;
    }

    try {
      const data = fromContext ?? await getBooking(bookingId);
      setBooking(data);

      const [agency, cats] = await Promise.all([
        getAgency(data.agencyId).catch(() => null),
        getServiceCategories().catch(() => [] as ApiServiceCategory[]),
      ]);
      setAgencyName((agency as any)?.name ?? (agency as any)?.data?.name ?? 'Agency');
      const match = cats.find(c => c.id === data.serviceCategoryId);
      setCategoryName(match?.name ?? 'Service');
    } catch (e: any) {
      setLoadError('Booking not found. It may have been cancelled or expired.');
    }
  }

  if (!booking && !loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackBtn onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centre}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Btn variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            Go back
          </Btn>
        </View>
      </SafeAreaView>
    );
  }

  const b = booking!;
  const canCancel = b.status === 'PENDING_ASSIGNMENT' || b.status === 'ASSIGNED';
  const canReview = b.status === 'COMPLETED' && !b.reviewed;

  async function handleCancel() {
    setCancelError(null);
    setCancelling(true);
    try {
      await cancelBooking(b.id);
      navigation.goBack();
    } catch (e: any) {
      setCancelError(e?.message ?? 'Could not cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Booking detail</Eyebrow>
        <ScreenTitle>{agencyName || '—'}</ScreenTitle>
        <View style={styles.headerMeta}>
          <Sub>{categoryName || '—'}</Sub>
          <View style={[styles.statusPill, { backgroundColor: statusColor(b.status) + '22',
              borderRadius: 100, borderWidth: 1, borderColor: statusColor(b.status) + '44' }]}>
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
        <Divider />
        {b.totalHours ? (
          <>
            <Row label="Duration" value={`${b.totalHours} hr${b.totalHours !== 1 ? 's' : ''}`} />
            <Divider />
          </>
        ) : null}
        <Row
          label="Status"
          value={statusLabel(b.status)}
          valueStyle={{ color: statusColor(b.status) }}
        />
        {b.familyNotes ? (
          <>
            <Divider />
            <Row label="Notes" value={b.familyNotes} />
          </>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.actions}>
        {cancelError ? <Text style={styles.inlineError}>{cancelError}</Text> : null}

        {canReview && (
          <Btn
            onPress={() => navigation.navigate('Review', { bookingId: b.id })}
            style={{ backgroundColor: Colors.success }}
            textColor={Colors.paper}>
            Leave a review
          </Btn>
        )}

        {canCancel && (
          <Btn variant="ghost" onPress={handleCancel}
          style={{ marginTop: canReview ? 10 : 0, borderColor: cancelling ? Colors.line : Colors.dangerBorder, opacity: cancelling ? 0.5 : 1 }}>
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </Btn>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 8, paddingBottom: 10 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: Fonts.interSemiBold, fontSize: 11.5 },
  actions: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.paper,
  },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_H_PADDING },
  errorText: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.danger, textAlign: 'center' },
  inlineError: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, marginBottom: 8, textAlign: 'center' },
});