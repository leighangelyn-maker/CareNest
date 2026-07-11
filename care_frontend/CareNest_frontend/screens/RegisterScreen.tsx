import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';

export default function RegisterScreen({ navigation }: any) {
  const [role, setRole]         = useState<'client' | 'agency'>('client');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', `Account created as ${role === 'client' ? 'Client' : 'Agency'}!`);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏠 Care Nest</Text>
        <Text style={styles.subtitle}>Create an account</Text>

        <Text style={styles.roleLabel}>I am a...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleChip, role === 'client' && styles.roleChipActive]}
            onPress={() => setRole('client')}>
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>👤 Client</Text>
            <Text style={[styles.roleDesc, role === 'client' && styles.roleDescActive]}>Looking for services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleChip, role === 'agency' && styles.roleChipActive]}
            onPress={() => setRole('agency')}>
            <Text style={[styles.roleText, role === 'agency' && styles.roleTextActive]}>🏢 Agency</Text>
            <Text style={[styles.roleDesc, role === 'agency' && styles.roleDescActive]}>Providing services</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input}
          placeholder={role === 'agency' ? 'Agency Name' : 'Full Name'}
          placeholderTextColor="#888" value={name} onChangeText={setName} />

        <TextInput style={styles.input} placeholder="Email"
          placeholderTextColor="#888" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Phone Number"
          placeholderTextColor="#888" value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" />

        <TextInput style={styles.input} placeholder="Password"
          placeholderTextColor="#888" value={password}
          onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register as {role === 'client' ? 'Client' : 'Agency'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  scroll:         { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title:          { fontSize: 36, fontWeight: 'bold', color: '#00BCD4', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 24 },
  roleLabel:      { color: '#00BCD4', fontSize: 14, marginBottom: 10 },
  roleRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleChip:       { flex: 1, borderWidth: 1, borderColor: '#00BCD4', borderRadius: 12, padding: 14, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#00BCD4' },
  roleText:       { color: '#00BCD4', fontWeight: 'bold', fontSize: 15 },
  roleTextActive: { color: '#fff' },
  roleDesc:       { color: '#00BCD4', fontSize: 12, marginTop: 4 },
  roleDescActive: { color: '#fff' },
  input:          { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  button:         { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:           { color: '#00BCD4', textAlign: 'center', fontSize: 14 },
});