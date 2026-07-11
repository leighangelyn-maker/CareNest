import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function NewBookingScreen({ navigation, route }: any) {
  const { service } = route.params;
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [duration, setDuration] = useState('4');
  const [address, setAddress]   = useState('');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);

  const RATE_PER_HOUR = 50;
  const totalAmount   = parseFloat(duration || '0') * RATE_PER_HOUR;

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const handlePaymentSuccess = async (transactionRef: string) => {
    await scheduleBookingReminder(date, time, service);
    Alert.alert(
      '🎉 Booking Confirmed!',
      `Transaction ref: ${transactionRef}\nA reminder has been set.`,
      [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
    );
  };

  const scheduleBookingReminder = async (
    bookingDate: string, bookingTime: string, serviceName: string
  ) => {
    try {
      const [year, month, day] = bookingDate.split('-').map(Number);
      const [hour, minute]     = bookingTime.split(':').map(Number);
      const bookingDateTime    = new Date(year, month - 1, day, hour, minute);
      const reminderTime       = new Date(bookingDateTime.getTime() - 60 * 60 * 1000);
      if (reminderTime <= new Date()) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Upcoming Booking – Care Nest',
          body: `Your ${serviceName} booking starts in 1 hour!`,
          data: {},
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const handleConfirm = () => {
    if (!date || !time || !address) {
      Alert.alert('Missing Fields', 'Please fill in date, time, and address.');
      return;
    }
    navigation.navigate('Payment', {
      booking: { service, date, time, duration, address, notes, totalAmount },
      onPaymentSuccess: handlePaymentSuccess,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Book a {service}</Text>

        <Text style={styles.label}>Date *</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD"
          placeholderTextColor="#888" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Start Time *</Text>
        <TextInput style={styles.input} placeholder="HH:MM e.g. 09:00"
          placeholderTextColor="#888" value={time} onChangeText={setTime} />

        <Text style={styles.label}>Duration (hours)</Text>
        <View style={styles.durationRow}>
          {['2', '4', '6', '8'].map((h) => (
            <TouchableOpacity key={h}
              style={[styles.durationChip, duration === h && styles.durationChipActive]}
              onPress={() => setDuration(h)}>
              <Text style={[styles.durationText, duration === h && styles.durationTextActive]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Address *</Text>
        <TextInput style={styles.input} placeholder="Your home address"
          placeholderTextColor="#888" value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Any special instructions..." placeholderTextColor="#888"
          value={notes} onChangeText={setNotes} multiline numberOfLines={4} />

        <View style={styles.priceBadge}>
          <Text style={styles.priceLabel}>Estimated Total</Text>
          <Text style={styles.priceValue}>GHS {totalAmount.toFixed(2)}</Text>
          <Text style={styles.priceNote}>GHS {RATE_PER_HOUR}/hr × {duration} hrs</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConfirm} disabled={loading}>
          <Text style={styles.buttonText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:            { padding: 16 },
  backText:           { color: '#00BCD4', fontSize: 16 },
  scroll:             { padding: 24, paddingBottom: 48 },
  title:              { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label:              { color: '#00BCD4', fontSize: 14, marginBottom: 6 },
  input:              { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  textArea:           { height: 100, textAlignVertical: 'top' },
  durationRow:        { flexDirection: 'row', gap: 10, marginBottom: 16 },
  durationChip:       { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00BCD4', alignItems: 'center' },
  durationChipActive: { backgroundColor: '#00BCD4' },
  durationText:       { color: '#00BCD4', fontWeight: '600' },
  durationTextActive: { color: '#fff' },
  priceBadge:         { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'center' },
  priceLabel:         { color: '#888', fontSize: 13 },
  priceValue:         { color: '#00BCD4', fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  priceNote:          { color: '#888', fontSize: 12 },
  button:             { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonDisabled:     { opacity: 0.5 },
  buttonText:         { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});