import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
  ActivityIndicator, Linking
} from 'react-native';
import {
  getBookingById, setBookingPrice, initiatePayment, getPaymentByBooking
} from '../services/api';

function formatMinorUnits(minorUnits: number, currency = 'GHS') {
  return `${currency} ${(minorUnits / 100).toLocaleString()}`;
}

export default function PaymentScreen({ route, navigation }: any) {
  const bookingId: string | undefined = route.params?.bookingId;

  const [booking, setBooking] = useState<any>(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [settingPrice, setSettingPrice] = useState(false);
  const [payingNow, setPayingNow] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const loadBooking = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking information.');
      navigation.goBack();
      return;
    }
    try {
      const response = await getBookingById(bookingId);
      const data = response.data ?? response;
      setBooking(data);
      if (data.hourlyRateMinorUnits > 0) {
        setHourlyRate(String(data.hourlyRateMinorUnits / 100));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load this booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const handleSetPrice = async () => {
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid amount', 'Enter the hourly rate you agreed on the phone.');
      return;
    }
    setSettingPrice(true);
    try {
      const response = await setBookingPrice(bookingId!, Math.round(rate * 100));
      setBooking(response.data ?? response);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not set the price.');
    } finally {
      setSettingPrice(false);
    }
  };

  const handlePayNow = async () => {
    setPayingNow(true);
    try {
      const response = await initiatePayment(bookingId!);
      const payment = response.data ?? response;
      if (payment.authorizationUrl) {
        await Linking.openURL(payment.authorizationUrl);
      } else {
        Alert.alert('Error', 'No payment link was returned. Try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start payment.');
    } finally {
      setPayingNow(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await getPaymentByBooking(bookingId!);
      const payment = response.data ?? response;
      setPaymentStatus(payment.status);
      if (payment.status === 'SUCCESS' || payment.status === 'PAID') {
        Alert.alert('Payment Confirmed', 'Your payment was received.', [
          { text: 'OK', onPress: () => navigation.navigate('BookingMain') },
        ]);
      } else {
        Alert.alert('Still Pending', `Payment status: ${payment.status}. Try again in a moment.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not check payment status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#C62828" />
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

  const hasPrice = booking.hourlyRateMinorUnits > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complete Payment</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Booking Status</Text>
          <Text style={styles.summaryValue}>{booking.status}</Text>

          {booking.totalHours > 0 && (
            <>
              <Text style={styles.summaryLabel}>Hours</Text>
              <Text style={styles.summaryValue}>{booking.totalHours} hrs</Text>
            </>
          )}

          {hasPrice && (
            <>
              <Text style={styles.summaryLabel}>Agreed Hourly Rate</Text>
              <Text style={styles.summaryValue}>{formatMinorUnits(booking.hourlyRateMinorUnits)}</Text>

              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryTotal}>{formatMinorUnits(booking.subtotalMinorUnits)}</Text>
            </>
          )}
        </View>

        {!hasPrice ? (
          <>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                No price set yet. Enter the hourly rate you agreed on the phone with the agency, then confirm.
              </Text>
            </View>

            <Text style={styles.label}>Agreed Hourly Rate (NGN)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500"
              placeholderTextColor="#999"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.button, settingPrice && styles.buttonDisabled]}
              onPress={handleSetPrice}
              disabled={settingPrice}>
              {settingPrice
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Confirm Price</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, payingNow && styles.buttonDisabled]}
              onPress={handlePayNow}
              disabled={payingNow}>
              {payingNow
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Pay Now</Text>}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              You'll be taken to a secure payment page. Once done, come back and tap below to confirm.
            </Text>

            <TouchableOpacity
              style={[styles.secondaryButton, checkingStatus && styles.buttonDisabled]}
              onPress={handleCheckStatus}
              disabled={checkingStatus}>
              {checkingStatus
                ? <ActivityIndicator color="#0D1B2A" />
                : <Text style={styles.secondaryButtonText}>I've Completed Payment</Text>}
            </TouchableOpacity>

            {paymentStatus && (
              <Text style={styles.statusText}>Last checked status: {paymentStatus}</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#FFFFFF' },
  centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error:               { color: '#0D1B2A' },
  header:              { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backText:            { color: '#0D1B2A', fontSize: 15, fontWeight: '600' },
  scroll:              { padding: 20, paddingTop: 0, paddingBottom: 60 },
  title:               { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  summaryCard:         { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16 },
  summaryLabel:        { color: '#999', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 10 },
  summaryValue:        { color: '#1A1A1A', fontSize: 15, fontWeight: '600', marginTop: 2 },
  summaryTotal:        { color: '#0D1B2A', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  noteBox:             { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, marginTop: 20 },
  noteText:            { color: '#666666', fontSize: 12, lineHeight: 18 },
  label:               { color: '#0D1B2A', fontSize: 13, marginTop: 20, marginBottom: 8 },
  input:               { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, fontSize: 15 },
  button:              { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled:      { opacity: 0.5 },
  buttonText:          { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  helperText:          { color: '#666666', fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  secondaryButton:     { borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 18 },
  secondaryButtonText: { color: '#0D1B2A', fontSize: 14, fontWeight: '600' },
  statusText:          { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 12 },
});