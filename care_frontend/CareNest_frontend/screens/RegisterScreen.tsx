import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { registerUser, registerAgency } from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [accountType, setAccountType] = useState<'client' | 'agency'>('client');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [agencyName, setAgencyName] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyDescription, setAgencyDescription] = useState('');

  const validate = (): string | null => {
    if (!email || !phone || !password) return 'Fill in all required fields.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (accountType === 'client' && (!firstName || !lastName)) {
      return 'Enter your first and last name.';
    }
    if (accountType === 'agency' && (!agencyName || !agencyPhone || !agencyEmail)) {
      return 'Fill in all agency details.';
    }
    return null;
  };

  const handleRegister = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Missing info', error);
      return;
    }

    setLoading(true);
    try {
      if (accountType === 'client') {
        await registerUser(firstName, lastName, email, phone, password);
      } else {
        await registerAgency(
          email, phone, password,
          agencyName, agencyPhone, agencyEmail, agencyDescription
        );
      }

      Alert.alert(
        'Account created',
        'Check your email for a verification link before logging in.',
        [{ text: 'OK', onPress: () => navigation.replace('EmailVerification', { email }) }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Care Nest</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <Text style={styles.roleLabel}>I am registering as...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleChip, accountType === 'client' && styles.roleChipActive]}
            onPress={() => setAccountType('client')}>
            <Text style={[styles.roleText, accountType === 'client' && styles.roleTextActive]}>
              Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleChip, accountType === 'agency' && styles.roleChipActive]}
            onPress={() => setAccountType('agency')}>
            <Text style={[styles.roleText, accountType === 'agency' && styles.roleTextActive]}>
              Agency
            </Text>
          </TouchableOpacity>
        </View>

        {accountType === 'client' ? (
          <>
            <TextInput style={styles.input} placeholder="First Name"
              placeholderTextColor="#999" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Last Name"
              placeholderTextColor="#999" value={lastName} onChangeText={setLastName} />
          </>
        ) : (
          <>
            <TextInput style={styles.input} placeholder="Agency Name"
              placeholderTextColor="#999" value={agencyName} onChangeText={setAgencyName} />
            <TextInput style={styles.input} placeholder="Agency Phone"
              placeholderTextColor="#999" value={agencyPhone} onChangeText={setAgencyPhone}
              keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Agency Email"
              placeholderTextColor="#999" value={agencyEmail} onChangeText={setAgencyEmail}
              keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={[styles.input, styles.multiline]} placeholder="Brief description of your agency"
              placeholderTextColor="#999" value={agencyDescription} onChangeText={setAgencyDescription}
              multiline numberOfLines={3} />
          </>
        )}

        <TextInput style={styles.input} placeholder="Your Email (for login)"
          placeholderTextColor="#999" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Your Phone"
          placeholderTextColor="#999" value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" />

        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput} placeholder="Password"
            placeholderTextColor="#999" value={password} onChangeText={setPassword}
            secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput} placeholder="Confirm Password"
            placeholderTextColor="#999" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:         { padding: 24, paddingTop: 40, paddingBottom: 40 },
  title:          { fontSize: 32, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 16, color: '#1A1A1A', textAlign: 'center', marginBottom: 28 },
  roleLabel:      { color: '#0D1B2A', fontSize: 14, marginBottom: 10 },
  roleRow:        { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleChip:       { flex: 1, borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 12, padding: 14, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#0D1B2A' },
  roleText:       { color: '#0D1B2A', fontWeight: 'bold', fontSize: 15 },
  roleTextActive: { color: '#fff' },
  input:          { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  multiline:      { height: 80, textAlignVertical: 'top' },
  passwordRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, marginBottom: 16 },
  passwordInput:  { flex: 1, color: '#1A1A1A', padding: 14, fontSize: 16 },
  toggleButton:   { paddingHorizontal: 14 },
  toggleText:     { color: '#0D1B2A', fontSize: 13, fontWeight: '600' },
  button:         { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16, marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:           { color: '#0D1B2A', textAlign: 'center', fontSize: 14 },
});