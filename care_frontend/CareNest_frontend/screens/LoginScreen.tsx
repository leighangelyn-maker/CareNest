 import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';

export default function BookingScreen({ navigation }: any) {
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleBooking = () => {
    if (!service || !date || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Booking submitted!');
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Booking</Text>

        <Text style={styles.label}>Service Type *</Text>
        <TextInput style={styles.input}
          placeholder="e.g. Nanny, Cleaner, Cook"
          placeholderTextColor="#888" value={service}
          onChangeText={setService} />

        <Text style={styles.label}>Date *</Text>
        <TextInput style={styles.input}
          placeholder="e.g. 2026-06-20"
          placeholderTextColor="#888" value={date}
          onChangeText={setDate} />

        <Text style={styles.label}>Address *</Text>
        <TextInput style={styles.input}
          placeholder="Your home address"
          placeholderTextColor="#888" value={address}
          onChangeText={setAddress} />

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Any special instructions..."
          placeholderTextColor="#888" value={notes}
          onChangeText={setNotes} multiline numberOfLines={4} />

        <TouchableOpacity style={styles.button} onPress={handleBooking}>
          <Text style={styles.buttonText}>Confirm Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F44' },
  scroll: { padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { color: '#00BCD4', fontSize: 14, marginBottom: 6 },
  input: { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#00BCD4', textAlign: 'center', fontSize: 14 },
});
