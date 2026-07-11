import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'client' | 'agency'>('client');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (role === 'agency') {
      navigation.navigate('AgencyHome');
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏠 Care Nest</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <Text style={styles.roleLabel}>Login as...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleChip, role === 'client' && styles.roleChipActive]}
            onPress={() => setRole('client')}>
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>👤 Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleChip, role === 'agency' && styles.roleChipActive]}
            onPress={() => setRole('agency')}>
            <Text style={[styles.roleText, role === 'agency' && styles.roleTextActive]}>🏢 Agency</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Email"
          placeholderTextColor="#888" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Password"
          placeholderTextColor="#888" value={password}
          onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  scroll:         { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title:          { fontSize: 36, fontWeight: 'bold', color: '#00BCD4', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 32 },
  roleLabel:      { color: '#00BCD4', fontSize: 14, marginBottom: 10 },
  roleRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleChip:       { flex: 1, borderWidth: 1, borderColor: '#00BCD4', borderRadius: 12, padding: 14, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#00BCD4' },
  roleText:       { color: '#00BCD4', fontWeight: 'bold', fontSize: 15 },
  roleTextActive: { color: '#fff' },
  input:          { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  button:         { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:           { color: '#00BCD4', textAlign: 'center', fontSize: 14 },
});