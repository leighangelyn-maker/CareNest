import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, BookingStatus, ApiServiceCategory } from '../types';
import { useBookings } from '../BookingContext';
import { getServiceCategories } from '../api/bookings';
import { Btn, CheckIcon, Divider, ProgressBar, Row, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirm'>;

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
    case 'ASSIGNED':     return Colors.gold;
    case 'IN_PROGRESS':  return Colors.navy;
    case 'COMPLETED':    return Colors.success;
    case 'CANCELLED':    return Colors.danger;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function ConfirmScreen({ navigation, route }: Props) {
  const { booking, agency } = route.params;
  console.log('BOOKING.familyId from server:', booking.familyId);
  const { addBooking } = useBookings();
  const shortRef = booking.id.slice(0, 8) + '…';

  const [categoryName, setCategoryName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const cats: ApiServiceCategory[] = await getServiceCategories();
        const match = cats.find(c => c.id === booking.serviceCategoryId);
        setCategoryName(match?.name ?? 'Service');
      } catch {
        setCategoryName('Service');
      }
    })();
  }, [booking.serviceCategoryId]);

  // Add booking to context immediately so BookingsScreen shows it
  useEffect(() => {
    addBooking(booking);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar current={3} total={3} />

      {/* Ticket */}
      <View style={styles.ticket}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={[styles.notch, styles.notchRight]} />
        <View style={styles.seal}><CheckIcon /></View>
        <ScreenTitle size={18}>You're booked!</ScreenTitle>
        <Sub style={{ textAlign: 'center', marginTop: 4 }}>
          {agency.name} · {categoryName}
        </Sub>
        <View style={{ marginTop: 14, width: '100%' }}>
          <Divider dashed />
          <Row label="Booking ref" value={shortRef} />
          <Row label="Start" value={formatDate(booking.startTime)} />
          <Row label="End" value={formatDate(booking.endTime)} />
          <Row
            label="Status"
            value={statusLabel(booking.status)}
            valueStyle={{ color: statusColor(booking.status) }}
          />
        </View>
      </View>

      <Btn onPress={() => navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Bookings' } }],
      })}>
        View my bookings
      </Btn>
      <Btn variant="secondary" onPress={() => navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      })} style={{ marginTop: 10 }}>
        Back to search
      </Btn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper, padding: SCREEN_H_PADDING, paddingTop: 24 },
  ticket: {
    marginVertical: 16, backgroundColor: Colors.paper,
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 18,
    padding: 22, alignItems: 'center', overflow: 'hidden',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  notch: {
    position: 'absolute', width: 20, height: 20,
    backgroundColor: Colors.paper, borderRadius: 10, top: '50%', marginTop: -10,
  },
  notchLeft: { left: -10 },
  notchRight: { right: -10 },
  seal: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.successBg, borderWidth: 2, borderColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
});