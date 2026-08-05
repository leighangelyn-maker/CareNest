import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator, Text,
  TextInput, TouchableOpacity, Linking,KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ApiBooking, BookingStatus, ApiServiceCategory } from '../types';
import { getBooking, getServiceCategories, setBookingPrice, initiatePayment } from '../api/bookings';
import { getAgency } from '../api/agencies';
import { getPaymentByBooking, ApiPayment } from '../api/payments';
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
    case 'PENDING_ASSIGNMENT': return Colors.gold;
    case 'ASSIGNED':           return Colors.navy;
    case 'IN_PROGRESS':        return Colors.navy;
    case 'COMPLETED':          return Colors.success;
    case 'CANCELLED':          return Colors.danger;
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
  const [agencyPhone, setAgencyPhone] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Payment state
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const loadBooking = useCallback(async () => {
    const fromContext = bookings.find(b => b.id === bookingId);
    if (fromContext) {
      setBooking(fromContext);
      setAgencyName((fromContext as any).agencyName ?? '');
      setCategoryName((fromContext as any).categoryName ?? '');
    }
    try {
      // Always hit the API on focus so status (e.g. payment completion) is fresh,
      // even if a stale copy exists in context.
      const data = await getBooking(bookingId);
      setBooking(data);
      const [agency, cats] = await Promise.all([
        getAgency(data.agencyId).catch(() => null),
        getServiceCategories().catch(() => [] as ApiServiceCategory[]),
      ]);
      const resolvedAgency = (agency as any)?.data ?? agency;
      setAgencyName(resolvedAgency?.name ?? 'Agency');
      setAgencyPhone(resolvedAgency?.phone ?? null);
      const match = cats.find(c => c.id === data.serviceCategoryId);
      setCategoryName(match?.name ?? 'Service');
      setLoadError(null);
    } catch {
      if (!fromContext) {
        setLoadError('Booking not found. It may have been cancelled or expired.');
      }
    }
  }, [bookingId, bookings]);

  useFocusEffect(
    useCallback(() => {
      loadBooking();
    }, [loadBooking])
  );

  async function handlePay() {
    const rate = parseFloat(payAmount);
    if (isNaN(rate) || rate <= 0) {
      setPayError('Enter the amount you agreed with the agency.');
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      await setBookingPrice(booking!.id, Math.round(rate * 100));
      const response = await initiatePayment(booking!.id);
      const payment = (response as any).data ?? response;
      if (payment.authorizationUrl) {
        await Linking.openURL(payment.authorizationUrl);
        setPaymentOpened(true);
      } else {
        setPayError('No payment link returned. Please try again.');
      }
    } catch (e: any) {
      setPayError(e?.response?.data?.message ?? e?.message ?? 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  async function handleConfirmPayment() {
    setCheckingPayment(true);
    setPayError(null);
    try {
      const result = await getPaymentByBooking(booking!.id);
      setPayment(result);
      if (result?.status === 'PAID') {
        navigation.goBack();
      } else {
        setPayError("We haven't received confirmation from Paystack yet. This can take a minute — try again shortly.");
      }
    } finally {
      setCheckingPayment(false);
    }
  }

  async function handleCancel() {
    setCancelError(null);
    setCancelling(true);
    try {
      await cancelBooking(booking!.id);
      navigation.goBack();
    } catch (e: any) {
      setCancelError(e?.message ?? 'Could not cancel. Please try again.');
    } finally {
      setCancelling(false);
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
        <View style={styles.header}><BackBtn onPress={() => navigation.goBack()} /></View>
        <View style={styles.centre}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Btn variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>Go back</Btn>
        </View>
      </SafeAreaView>
    );
  }

  const b = booking!;
  const canCancel = b.status === 'PENDING_ASSIGNMENT';
  const canPay    = b.status === 'ASSIGNED';
  const canReview = b.status === 'COMPLETED' && !b.reviewed;

return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Booking detail</Eyebrow>
        <ScreenTitle>{agencyName || '—'}</ScreenTitle>
        <View style={styles.headerMeta}>
          <Sub>{categoryName || '—'}</Sub>
          <View style={[
            styles.statusPill,
            { backgroundColor: statusColor(b.status) + '22', borderColor: statusColor(b.status) + '44' }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(b.status) }]} />
            <Text style={[styles.statusPillText, { color: statusColor(b.status) }]}>
              {statusLabel(b.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* ← wrap everything below the header */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, paddingHorizontal: SCREEN_H_PADDING }}
          keyboardShouldPersistTaps="handled"
        >
          <Row label="Start"    value={formatDate(b.startTime)} />
          <Divider />
          <Row label="End"      value={formatDate(b.endTime)} />
          <Divider />
          {b.totalHours ? (
            <>
              <Row label="Duration" value={`${b.totalHours} hr${b.totalHours !== 1 ? 's' : ''}`} />
              <Divider />
            </>
          ) : null}
          <Row label="Status" value={statusLabel(b.status)} valueStyle={{ color: statusColor(b.status) }} />
          {b.familyNotes ? (
            <>
              <Divider />
              <Row label="Notes" value={b.familyNotes} />
            </>
          ) : null}

          {b.status === 'PENDING_ASSIGNMENT' && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Waiting for worker assignment</Text>
              <Text style={styles.infoBody}>
                The agency is reviewing your request and will assign a worker shortly.
                You'll be able to call them to agree on a rate once a worker is assigned.
              </Text>
            </View>
          )}

          {canPay && (
            <View style={styles.payCard}>
              <Text style={styles.payTitle}>Worker assigned — ready to pay</Text>
              <Text style={styles.payBody}>
                A worker has been assigned to your booking.
                {agencyPhone ? ` Call the agency on ${agencyPhone} to agree on a rate, then` : ' Call the agency to agree on a rate, then'} enter the amount below and pay securely.
              </Text>

              {agencyPhone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${agencyPhone}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.callBtnText}>Call agency — {agencyPhone}</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.payLabel}>Agreed amount (GHS)</Text>
              <TextInput
                style={styles.payInput}
                value={payAmount}
                onChangeText={v => { setPayAmount(v); setPayError(null); }}
                keyboardType="numeric"
                placeholder="e.g. 150"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="done"
              />

              {payError && <Text style={styles.payError}>{payError}</Text>}

              <TouchableOpacity
                style={[styles.payBtn, paying && { opacity: 0.6 }]}
                onPress={handlePay}
                disabled={paying}
                activeOpacity={0.85}
              >
                {paying
                  ? <ActivityIndicator color={Colors.goldLight} />
                  : <Text style={styles.payBtnText}>Pay now →</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.actions}>
          {cancelError ? <Text style={styles.inlineError}>{cancelError}</Text> : null}
          {canReview && (
            <Btn
              onPress={() => navigation.navigate('Review', { bookingId: b.id })}
              style={{ backgroundColor: Colors.success }}
              textColor={Colors.paper}
            >
              Leave a review
            </Btn>
          )}
          {canCancel && (
            <Btn
              variant="ghost"
              onPress={handleCancel}
              style={{
                marginTop: canReview ? 10 : 0,
                borderColor: cancelling ? Colors.line : Colors.dangerBorder,
                opacity: cancelling ? 0.5 : 1,
              }}
            >
              {cancelling ? 'Cancelling…' : 'Cancel booking'}
            </Btn>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.paper },
  header:         { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 8, paddingBottom: 10 },
  headerMeta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: Fonts.interSemiBold, fontSize: 11.5 },
  actions:        { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 14, paddingBottom: 24, borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.paper },
  centre:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_H_PADDING },
  errorText:      { fontFamily: Fonts.inter, fontSize: 14, color: Colors.danger, textAlign: 'center' },
  inlineError:    { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, marginBottom: 8, textAlign: 'center' },

  // Pending info card
  infoCard:       { backgroundColor: Colors.navyPale, borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: Colors.line },
  infoTitle:      { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 6 },
  infoBody:       { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20 },

  // Payment card
  payCard:        { backgroundColor: Colors.navyPale, borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: Colors.line },
  payTitle:       { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 6 },
  payBody:        { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20, marginBottom: 14 },
  callBtn:        { backgroundColor: Colors.navy, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  callBtnText:    { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.goldLight },
  payLabel:       { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.navy, marginBottom: 6 },
  payInput:       { backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.ink, fontFamily: Fonts.inter, marginBottom: 8 },
  payError:       { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.danger, marginBottom: 8 },
  payBtn:         { backgroundColor: Colors.navy, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  payBtnText:     { fontFamily: Fonts.interBold, fontSize: 15, color: Colors.goldLight },
  confirmBtn:     { marginTop: 10, borderWidth: 1.5, borderColor: Colors.navy, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  confirmBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.navy },
});