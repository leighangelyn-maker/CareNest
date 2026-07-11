import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native';

export default function PaymentScreen({ navigation, route }: any) {
  const { service, agencyName } = route.params;
  const [method, setMethod]   = useState<'momo' | 'card'>('momo');
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);

  const COMMISSION     = 0.05;
  const agreedAmount   = parseFloat(amount || '0');
  const commission     = agreedAmount * COMMISSION;
  const agencyReceives = agreedAmount - commission;

  // Agency payment details — replace with real data from backend
  const careNestMoMo = {
    number: '+233 532809673',
    name:   'Martha Anasah',
    network: 'MTN MoMo',
  };

  const METHODS = [
    { id: 'momo', label: '📱 Mobile Money' },
    { id: 'card', label: '💳 Debit / Credit Card' },
  ] as const;

  const handlePay = () => {
    if (!amount || agreedAmount <= 0) {
      Alert.alert('Enter Amount', 'Please enter the amount agreed with the agency.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '✅ Payment Successful!',
        `GHS ${agreedAmount.toFixed(2)} paid successfully!\nThe agency will assign a worker to you shortly.`,
        [{ text: 'OK', onPress: () => navigation.navigate('HomeMain') }]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Payment</Text>

        {/* Booking summary */}
        <View style={styles.card}>
          <Row label="Service" value={service} />
          {agencyName && <Row label="Agency" value={agencyName} />}
        </View>

        {/* Payment method */}
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

        {/* MoMo details */}
        {method === 'momo' && (
          <View style={styles.momoCard}>
            <Text style={styles.momoTitle}>Send Payment To</Text>
            <Text style={styles.momoNetwork}>{careNestMoMo.network}</Text>
            <Text style={styles.momoNumber}>{careNestMoMo.number}</Text>
            <Text style={styles.momoName}>Account Name: {careNestMoMo.name}</Text>
          </View>
        )}

        {/* Amount input */}
        <Text style={styles.label}>Amount Agreed with Agency (GHS)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount e.g. 200"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Breakdown */}
        {agreedAmount > 0 && (
          <View style={styles.card}>
            <Row label="Agreed Amount"      value={`GHS ${agreedAmount.toFixed(2)}`} />
            <Row label="careNest Fee (5%)" value={`GHS ${commission.toFixed(2)}`} />
            <View style={styles.divider} />
            <Row label="Agency Receives"    value={`GHS ${agencyReceives.toFixed(2)}`} highlight />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePay} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                Pay GHS {agreedAmount > 0 ? agreedAmount.toFixed(2) : '0.00'}
              </Text>
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
      <Text style={{
        color: highlight ? '#00BCD4' : '#fff',
        fontSize: highlight ? 18 : 14,
        fontWeight: highlight ? 'bold' : 'normal'
      }}>
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
  input:            { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 18 },
  card:             { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 16 },
  momoCard:         { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#00BCD4' },
  momoTitle:        { color: '#888', fontSize: 13, marginBottom: 8 },
  momoNetwork:      { color: '#00BCD4', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  momoNumber:       { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  momoName:         { color: '#aaa', fontSize: 13 },
  divider:          { height: 1, backgroundColor: '#2E4060', marginVertical: 10 },
  methodRow:        { flexDirection: 'row', gap: 12, marginBottom: 16 },
  methodChip:       { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#00BCD4', alignItems: 'center' },
  methodChipActive: { backgroundColor: '#00BCD4' },
  methodText:       { color: '#00BCD4', fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  button:           { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  buttonDisabled:   { opacity: 0.5 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secureNote:       { color: '#888', textAlign: 'center', fontSize: 13 },
});