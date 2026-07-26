import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createWorker } from '../services/api';

// Same 3 real category UUIDs used on BookingScreen.
const SERVICE_CATEGORIES = [
  { id: '1c19a96b-944f-4d61-87db-59c24024d666', label: 'Nanny' },
  { id: '0c67561e-55b1-4947-ac5b-a37221c01e09', label: 'Cleaning' },
  { id: '77cbd85e-3b8d-47be-ba57-3c687b24628e', label: 'Cooking' },
];

export default function AddWorkerScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState(SERVICE_CATEGORIES[0].id);
  const [hourlyRate, setHourlyRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert('Missing info', 'Full name and phone number are required.');
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Missing info', 'Enter a default hourly rate.');
      return;
    }

    setSubmitting(true);
    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      if (!agencyId) {
        Alert.alert('Error', 'No agency ID found. Try logging out and back in.');
        return;
      }

      await createWorker({
        agencyId,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        serviceCategoryId,
        defaultHourlyRateMinorUnits: Math.round(rate * 100),
      });

      Alert.alert('Worker Added', `${fullName} has been added to your team.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add worker.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AgencyHomeMain')}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add Worker</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Ama Serwaa"
          placeholderTextColor="#888" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="e.g. 0501234567"
          placeholderTextColor="#888" value={phoneNumber} onChangeText={setPhoneNumber}
          keyboardType="phone-pad" />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput style={styles.input} placeholder="worker@example.com"
          placeholderTextColor="#888" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Service Type</Text>
        <View style={styles.chipRow}>
          {SERVICE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, serviceCategoryId === c.id && styles.chipActive]}
              onPress={() => setServiceCategoryId(c.id)}>
              <Text style={[styles.chipText, serviceCategoryId === c.id && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Default Hourly Rate (GHS)</Text>
        <TextInput style={styles.input} placeholder="e.g. 25"
          placeholderTextColor="#888" value={hourlyRate} onChangeText={setHourlyRate}
          keyboardType="numeric" />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Add Worker</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  header:         { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backText:       { color: '#00BCD4', fontSize: 15, fontWeight: '600' },
  scroll:         { padding: 20, paddingTop: 0, paddingBottom: 60 },
  title:          { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  label:          { color: '#00BCD4', fontSize: 13, marginTop: 16, marginBottom: 6 },
  input:          { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, fontSize: 15 },
  chipRow:        { flexDirection: 'row', gap: 10 },
  chip:           { flex: 1, borderWidth: 1, borderColor: '#00BCD4', borderRadius: 10, padding: 12, alignItems: 'center' },
  chipActive:     { backgroundColor: '#00BCD4' },
  chipText:       { color: '#00BCD4', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  button:         { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});