import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import {
  BackBtn,
  Eyebrow,
  Field,
  ScreenTitle,
  Sub,
  inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerNote'>;

const SERVICE_TYPES = ['Nanny', 'Cook', 'Cleaner', 'Caregiver', 'Driver', 'Gardener', 'Tutor'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkerNoteScreen({ navigation }: Props) {
  const { register } = useAuth();

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Worker profile
  const [serviceType, setServiceType] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [step, setStep] = useState<'account' | 'otp' | 'profile'>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSendOtp() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Fill in name, email, and a password of at least 6 characters.');
      return;
    }
    // Skip OTP — go straight to profile setup
    setStep('profile');
  }

  async function handleVerifyOtp() {
    // Not used — kept for compatibility
    setOtpVerified(true);
    setStep('profile');
  }

  async function handleCreateAccount() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Fill in name, email, and a password of at least 6 characters.');
      return;
    }
    if (!serviceType) { setError('Select your service type.'); return; }
    if (!hourlyRate || isNaN(Number(hourlyRate))) { setError('Enter a valid hourly rate.'); return; }

    setLoading(true);
    setError(null);
    try {
      // Register as WORKER — this sends a verification email
      await register({
        name,
        email,
        password,
        role: 'WORKER',
        phone: phone || undefined,
        location: location || undefined,
      });
      // Show verification notice — worker profile will be set up after they verify and log in
      setStep('otp'); // re-use otp state as "verification pending" screen
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Account details ──
  if (step === 'account') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackBtn onPress={() => navigation.navigate('Role')} />
          <Eyebrow>Worker registration · Step 1 of 2</Eyebrow>
          <ScreenTitle>Create your worker account</ScreenTitle>
          <Sub>Join CareNest as a verified domestic worker and get booked by families.</Sub>

          <Field label="Full name">
            <TextInput style={inputStyle} value={name} onChangeText={setName}
              autoCapitalize="words" placeholder="Ama Boateng" placeholderTextColor={Colors.slateSoft} />
          </Field>
          <Field label="Email">
            <TextInput style={inputStyle} value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="ama@email.com" placeholderTextColor={Colors.slateSoft} />
          </Field>
          <Field label="Password (min 6 characters)">
            <TextInput style={inputStyle} value={password} onChangeText={setPassword}
              secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.slateSoft} />
          </Field>
          <Field label="Phone (optional)">
            <TextInput style={inputStyle} value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" placeholder="+233 24 000 0000" placeholderTextColor={Colors.slateSoft} />
          </Field>
          <Field label="Location">
            <TextInput style={inputStyle} value={location} onChangeText={setLocation}
              placeholder="Kumasi, Ashanti" placeholderTextColor={Colors.slateSoft} />
          </Field>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={loading}
            style={[styles.btn, loading && { opacity: 0.6 }]}
          >
            {loading
              ? <ActivityIndicator color={Colors.goldLight} />
              : <Text style={styles.btnText}>Continue →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Verification pending (after successful registration) ──
  if (step === 'otp') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
        <ScrollView contentContainerStyle={[styles.container, { alignItems: 'center', paddingTop: 60 }]}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 28 }}>✉️</Text>
          </View>
          <ScreenTitle>Check your inbox</ScreenTitle>
          <Sub style={{ textAlign: 'center', marginTop: 8 }}>
            We sent a verification link to{'\n'}
            <Text style={{ color: Colors.navy, fontFamily: Fonts.interBold }}>{email}</Text>
            {'\n\n'}
            Click the link to activate your account, then log in to complete your profile setup.
          </Sub>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.btn, { marginTop: 32 }]}
          >
            <Text style={styles.btnText}>Go to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Worker profile details ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => setStep('account')} />
        <Eyebrow>Worker registration · Step 2 of 2</Eyebrow>
        <ScreenTitle>Set up your profile</ScreenTitle>
        <Sub>This is what families see when they search for workers.</Sub>

        <Field label="Service type">
          <View style={styles.chipRow}>
            {SERVICE_TYPES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setServiceType(s)}
                style={[styles.chip, serviceType === s && styles.chipActive]}
              >
                <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="About yourself">
          <TextInput
            style={[inputStyle, { height: 90 }]}
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            placeholder="Describe your experience and strengths…"
            placeholderTextColor={Colors.slateSoft}
          />
        </Field>

        <Field label="Years of experience">
          <TextInput
            style={inputStyle}
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
            placeholder="e.g. 3"
            placeholderTextColor={Colors.slateSoft}
          />
        </Field>

        <Field label="Hourly rate (GHS)">
          <TextInput
            style={inputStyle}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="decimal-pad"
            placeholder="e.g. 25"
            placeholderTextColor={Colors.slateSoft}
          />
        </Field>

        <Field label="Available days">
          <View style={styles.chipRow}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(d)}
                style={[styles.chip, selectedDays.includes(d) && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedDays.includes(d) && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleCreateAccount}
          disabled={loading}
          style={[styles.btn, loading && { opacity: 0.6 }]}
        >
          {loading
            ? <ActivityIndicator color={Colors.goldLight} />
            : <Text style={styles.btnText}>Create worker account →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SCREEN_H_PADDING, paddingTop: 26, paddingBottom: 40 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, fontFamily: Fonts.inter },
  btn: {
    width: '100%',
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.navyPale,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
});
