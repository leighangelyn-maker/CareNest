import React, { useState, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import {
  BackBtn, ProgressBar, Field, ScreenTitle, Sub, inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerNote'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SERVICE_TYPES = ['Nanny', 'Cook', 'Cleaner', 'Caregiver', 'Driver', 'Gardener', 'Tutor'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="1.8">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ) : (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="1.8">
      <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" strokeLinecap="round" />
      <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round" />
      <Path d="M14.12 14.12a3 3 0 01-4.24-4.24" strokeLinecap="round" />
      <Path d="M1 1l22 22" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Shake helper ─────────────────────────────────────────────────────────────
function useShake() {
  const anim = useRef(new Animated.Value(0)).current;
  function trigger() {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }
  return { anim, trigger };
}

// ─── Error box ────────────────────────────────────────────────────────────────
function ErrorBox({ message, anim }: { message: string; anim: Animated.Value }) {
  return (
    <Animated.View style={[styles.errorBox, { transform: [{ translateX: anim }] }]}>
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.btn, loading && styles.btnDisabled]}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={Colors.goldLight} />
        : <Text style={styles.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Verification pending screen ──────────────────────────────────────────────
function VerificationPendingScreen({ email, onLogin }: { email: string; onLogin: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.verifyContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.verifyIcon, { transform: [{ scale: scaleAnim }] }]}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <Polyline points="22,6 12,13 2,6" />
          </Svg>
        </Animated.View>

        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Check your inbox</ScreenTitle>

        <View style={styles.verifyCard}>
          <Text style={styles.verifyTitle}>Verify your email to continue</Text>
          <Text style={styles.verifyBody}>
            A verification link has been sent to{'\n'}
            <Text style={styles.verifyEmail}>{email}</Text>
            {'\n\n'}
            Click the link to activate your account, then log in to complete your worker profile.
          </Text>
        </View>

        <PrimaryBtn label="Go to log in →" onPress={onLogin} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 1: Account details ──────────────────────────────────────────────────
function AccountStep({ onNext, defaultValues }: {
  onNext: (v: { name: string; email: string; password: string; phone: string; location: string }) => void;
  defaultValues: { name: string; email: string; password: string; phone: string; location: string };
}) {
  const [name, setName] = useState(defaultValues.name);
  const [email, setEmail] = useState(defaultValues.email);
  const [password, setPassword] = useState(defaultValues.password);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [location, setLocation] = useState(defaultValues.location);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { anim, trigger } = useShake();

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    Keyboard.dismiss();
    if (!validate()) { trigger(); return; }
    onNext({ name, email, password, phone, location });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <ProgressBar current={1} total={3} />
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Create Your Agency Account</ScreenTitle>
          <Sub style={{ marginBottom: 20 }}>Join CareNest as a verified domestic agency and connect with families near you.</Sub>

          <Field label="Full name *">
            <TextInput
              style={[inputStyle, fieldErrors.name && styles.inputError]}
              value={name} onChangeText={v => { setName(v); setFieldErrors(p => ({ ...p, name: '' })); }}
              autoCapitalize="words" placeholder="Ama Boateng" placeholderTextColor={Colors.slateSoft}
              returnKeyType="next"
            />
            {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
          </Field>

          <Field label="Email *">
            <TextInput
              style={[inputStyle, fieldErrors.email && styles.inputError]}
              value={email} onChangeText={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: '' })); }}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="ama@email.com" placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
          </Field>

          <Field label="Phone (optional)">
            <TextInput
              style={inputStyle} value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" placeholder="+233 24 000 0000" placeholderTextColor={Colors.slateSoft}
              returnKeyType="next"
            />
          </Field>

          <Field label="Location">
            <TextInput
              style={inputStyle} value={location} onChangeText={setLocation}
              placeholder="e.g. Kumasi, Ashanti" placeholderTextColor={Colors.slateSoft}
              returnKeyType="next"
            />
          </Field>

          <Field label="Password * (min 8 chars)">
            <View style={styles.passwordRow}>
              <TextInput
                style={[inputStyle, styles.passwordInput, fieldErrors.password && styles.inputError]}
                value={password}
                onChangeText={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: '' })); }}
                secureTextEntry={!showPassword} placeholder="••••••••"
                placeholderTextColor={Colors.slateSoft} returnKeyType="done" onSubmitEditing={handleNext}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
          </Field>

          {Object.keys(fieldErrors).length > 0 && (
            <ErrorBox message="Please fix the errors above before continuing." anim={anim} />
          )}

          <PrimaryBtn label="Continue →" onPress={handleNext} />

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ─── Step 2: Worker profile ───────────────────────────────────────────────────
function ProfileStep({ onSubmit, onBack }: {
  onSubmit: (v: { serviceType: string; bio: string; experienceYears: string; hourlyRate: string; selectedDays: string[] }) => void;
  onBack: () => void;
}) {
  const [serviceType, setServiceType] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { anim, trigger } = useShake();

  function toggleDay(day: string) {
    setSelectedDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day]);
  }

  function handleSubmit() {
    Keyboard.dismiss();
    if (!serviceType) { setError('Please select your service type.'); trigger(); return; }
    if (!hourlyRate || isNaN(Number(hourlyRate))) { setError('Enter a valid hourly rate.'); trigger(); return; }
    setError(null);
    onSubmit({ serviceType, bio, experienceYears, hourlyRate, selectedDays });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <BackBtn onPress={onBack} />
          <ProgressBar current={2} total={3} />
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Set up your profile</ScreenTitle>
          <Sub style={{ marginBottom: 20 }}>This is what families see when they search for workers.</Sub>

          <Field label="Service type *">
            <View style={styles.chipRow}>
              {SERVICE_TYPES.map(s => (
                <TouchableOpacity key={s} onPress={() => { setServiceType(s); setError(null); }}
                  style={[styles.chip, serviceType === s && styles.chipActive]} activeOpacity={0.75}>
                  <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="About yourself">
            <TextInput
              style={[inputStyle, { height: 88 }]} value={bio} onChangeText={setBio}
              multiline textAlignVertical="top"
              placeholder="Describe your experience and strengths…"
              placeholderTextColor={Colors.slateSoft} blurOnSubmit
            />
          </Field>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label="Years of experience">
                <TextInput
                  style={inputStyle} value={experienceYears} onChangeText={setExperienceYears}
                  keyboardType="number-pad" placeholder="e.g. 3"
                  placeholderTextColor={Colors.slateSoft} returnKeyType="next"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Hourly rate (₵) *">
                <TextInput
                  style={inputStyle} value={hourlyRate} onChangeText={v => { setHourlyRate(v); setError(null); }}
                  keyboardType="decimal-pad" placeholder="e.g. 25"
                  placeholderTextColor={Colors.slateSoft} returnKeyType="done"
                />
              </Field>
            </View>
          </View>

          <Field label="Available days">
            <View style={styles.chipRow}>
              {DAYS.map(d => (
                <TouchableOpacity key={d} onPress={() => toggleDay(d)}
                  style={[styles.chip, selectedDays.includes(d) && styles.chipActive]} activeOpacity={0.75}>
                  <Text style={[styles.chipText, selectedDays.includes(d) && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {error ? <ErrorBox message={error} anim={anim} /> : null}

          <PrimaryBtn label="Create agency account →" onPress={handleSubmit} />

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WorkerNoteScreen({ navigation }: Props) {
  const { register } = useAuth();

  type Step = 'account' | 'profile' | 'done';
  const [step, setStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Account values persisted across step transitions
  const [accountValues, setAccountValues] = useState({
    name: '', email: '', password: '', phone: '', location: '',
  });

  async function handleProfileSubmit(profile: {
    serviceType: string; bio: string;
    experienceYears: string; hourlyRate: string; selectedDays: string[];
  }) {
    setLoading(true);
    setGeneralError(null);
    try {
      // Split name into first/last
      const parts = accountValues.name.trim().split(' ');
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ') || firstName;

      await register({
        firstName,
        lastName,
        email: accountValues.email.trim().toLowerCase(),
        phone: accountValues.phone.trim() || '0000000000',
        password: accountValues.password,
      });

      // After account is created, try to save the worker profile
      // (may fail if email not yet verified — that's OK, user can complete via WorkerProfileSetup)
      try {
        await apiClient.post('/workers/me/profile', {
          serviceType: profile.serviceType,
          bio: profile.bio,
          experienceYears: profile.experienceYears ? parseInt(profile.experienceYears, 10) : 0,
          hourlyRate: profile.hourlyRate ? parseFloat(profile.hourlyRate) : 0,
          availableDays: profile.selectedDays.join(','),
        });
      } catch {
        // Silent — user can update profile later from WorkerProfileSetup screen
      }

      setSubmittedEmail(accountValues.email.trim().toLowerCase());
      setStep('done');
    } catch (e: any) {
      const msg =
        e?.response?.data?.data?.error ??
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'Registration failed. Please try again.';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <VerificationPendingScreen
        email={submittedEmail}
        onLogin={() => navigation.replace('Login')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {generalError ? (
        <View style={styles.generalErrorBanner}>
          <Text style={styles.generalErrorText}>{generalError}</Text>
          <TouchableOpacity onPress={() => setGeneralError(null)}>
            <Text style={[styles.generalErrorText, { fontFamily: Fonts.interBold }]}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.navy} />
          <Text style={styles.loadingText}>Creating your account…</Text>
        </View>
      ) : step === 'account' ? (
        <AccountStep
          defaultValues={accountValues}
          onNext={vals => { setAccountValues(vals); setStep('profile'); }}
        />
      ) : (
        <ProfileStep
          onBack={() => setStep('account')}
          onSubmit={handleProfileSubmit}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 48,
    flexGrow: 1,
  },

  // Password
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn: {
    position: 'absolute', right: 13, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },

  // Validation
  inputError: { borderColor: Colors.danger, borderWidth: 1.5 },
  fieldError: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.danger, marginTop: 4 },

  // Error box
  errorBox: {
    backgroundColor: Colors.dangerBg, borderWidth: 1,
    borderColor: Colors.dangerBorder, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, lineHeight: 19 },

  // Button
  btn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },

  // Chips
  twoCol: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    backgroundColor: Colors.navyPale, borderWidth: 1.5, borderColor: Colors.line,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },

  // Loading overlay
  loadingOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate },

  // General error banner
  generalErrorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.dangerBg, borderBottomWidth: 1,
    borderBottomColor: Colors.dangerBorder,
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 10,
  },
  generalErrorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, flex: 1 },

  // Verification screen
  verifyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 60,
  },
  verifyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.navyPale, borderWidth: 2, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  verifyCard: {
    width: '100%', backgroundColor: Colors.navySubtle,
    borderWidth: 1, borderColor: Colors.line, borderRadius: 14,
    padding: 16, marginTop: 16, marginBottom: 28,
  },
  verifyTitle: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 6 },
  verifyBody: {
    fontFamily: Fonts.inter, fontSize: 13.5, color: Colors.slate,
    lineHeight: 21, textAlign: 'center',
  },
  verifyEmail: { color: Colors.navy, fontFamily: Fonts.interBold },
});
