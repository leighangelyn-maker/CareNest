import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]               = useState<'client' | 'agency'>('client');
  const [loading, setLoading]         = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);
      const { accessToken, refreshToken, user } = response.data ?? response;

      if (!accessToken || !user) {
        Alert.alert('Login Failed', 'Unexpected response from server.');
        return;
      }

      if (user.status === 'PENDING_VERIFICATION') {
        Alert.alert(
          'Email not verified',
          'Please verify your email before logging in.',
          [{ text: 'OK', onPress: () => navigation.navigate('EmailVerification', { email: user.email }) }]
        );
        return;
      }

      const expectedRole = role === 'agency' ? 'AGENCY_ADMIN' : 'FAMILY';
      if (user.role !== expectedRole) {
        Alert.alert(
          'Wrong login type',
          `This account is registered as ${user.role === 'AGENCY_ADMIN' ? 'an Agency' : 'a Client'}. Please select the correct option above.`
        );
        return;
      }

      await AsyncStorage.setItem('token', accessToken);
await AsyncStorage.setItem('refreshToken', refreshToken);
await AsyncStorage.setItem('userRole', user.role);
await AsyncStorage.setItem('userData', JSON.stringify(user));

if (user.role === 'AGENCY_ADMIN') {
  const agencyId = user.agencyId ?? user.agency?.id ?? user.id;
  if (agencyId) {
    await AsyncStorage.setItem('agencyId', agencyId);
  } else {
    console.log('LOGIN USER OBJECT (no agencyId found):', JSON.stringify(user));
  }
  navigation.replace('AgencyHome');
} else {
  navigation.replace('Main');
}
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Care Nest</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <Text style={styles.roleLabel}>Login as...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleChip, role === 'client' && styles.roleChipActive]}
            onPress={() => setRole('client')}>
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleChip, role === 'agency' && styles.roleChipActive]}
            onPress={() => setRole('agency')}>
            <Text style={[styles.roleText, role === 'agency' && styles.roleTextActive]}>Agency</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Email"
          placeholderTextColor="#999" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput} placeholder="Password"
            placeholderTextColor="#999" value={password}
            onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Login</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:         { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title:          { fontSize: 36, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 16, color: '#1A1A1A', textAlign: 'center', marginBottom: 32 },
  roleLabel:      { color: '#0D1B2A', fontSize: 14, marginBottom: 10 },
  roleRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleChip:       { flex: 1, borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 12, padding: 14, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#0D1B2A' },
  roleText:       { color: '#0D1B2A', fontWeight: 'bold', fontSize: 15 },
  roleTextActive: { color: '#fff' },
  input:          { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  passwordRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, marginBottom: 16 },
  passwordInput:  { flex: 1, color: '#1A1A1A', padding: 14, fontSize: 16 },
  toggleButton:   { paddingHorizontal: 14 },
  toggleText:     { color: '#0D1B2A', fontSize: 13, fontWeight: '600' },
  button:         { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:           { color: '#0D1B2A', textAlign: 'center', fontSize: 14 },
});