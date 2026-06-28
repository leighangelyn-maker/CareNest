import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';

export default function PaymentScreen({ navigation, route }: any) {
  const { booking, onPaymentSuccess } = route.params;
  const [method, setMethod]   = useState<'momo' | 'card'>('momo');
  const [loading, setLoading] = useState(false);

  const METHODS = [
    { id: 'momo', label: '📱 Mobile Money' },
    { id: 'card', label: '💳 Debit / Credit Card' },
  ] as const;

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const fakeRef = `TXN-${Date.now()}`; // swap with real Paystack ref
      onPaymentSuccess(fakeRef);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Payment</Text>

        <View style={styles.card}>
          <Row label="Service"  value={booking.service} />
          <Row label="Date"     value={booking.date} />
          <Row label="Time"     value={booking.time} />
          <Row label="Duration" value={`${booking.duration} hrs`} />
          <Row label="Address"  value={booking.address} />
          <View style={styles.divider} />
          <Row label="Total"    value={`GHS ${booking.totalAmount.toFixed(2)}`} highlight />
        </View>

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {METHODS.map((m) => (
            <TouchableOpacity key={m.id}
              style={[styles.methodChip, method === m.id && styles.methodChipActive]}
              onPress={() => setMethod(m.id)}>
              <Text style={[styles.methodText, method === m.id && styles.methodTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePay} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Pay GHS {booking.totalAmount.toFixed(2)}</Text>
          }
        </TouchableOpacity>

        <Text style={styles.secureNote}>🔒 Secured by Paystack</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: '#888', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: highlight ? '#00BCD4' : '#fff', fontSize: highlight ? 18 : 14, fontWeight: highlight ? 'bold' : 'normal' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:          { padding: 16 },
  backText:         { color: '#00BCD4', fontSize: 16 },
  scroll:           { padding: 24, paddingBottom: 48 },
  title:            { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label:            { color: '#00BCD4', fontSize: 14, marginBottom: 10 },
  card:             { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 24 },
  divider:          { height: 1, backgroundColor: '#2E4060', marginVertical: 10 },
  methodRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodChip:       { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#00BCD4', alignItems: 'center' },
  methodChipActive: { backgroundColor: '#00BCD4' },
  methodText:       { color: '#00BCD4', fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  button:           { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  buttonDisabled:   { opacity: 0.5 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secureNote:       { color: '#888', textAlign: 'center', fontSize: 13 },
});