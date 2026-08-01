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
import { registerAgency } from '../api/auth';
import { persistAndSetStateFromResponse } from '../AuthContext';
import {
  BackBtn, ProgressBar, Field, ScreenTitle, Sub, inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerNote'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

function ErrorBox({ message, anim }: { message: string; anim: Animated.Value }) {
  return (
    <Animated.View style={[styles.errorBox, { transform: [{ translateX: anim }] }]}>
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

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

        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Agency account created!</ScreenTitle>

        <View style={styles.verifyCard}>
          <Text style={styles.verifyTitle}>Check your email</Text>
          <Text style={styles.verifyBody}>
            A verification link has been sent to{'\n'}
            <Text style={styles.verifyEmail}>{email}</Text>
            {'\n\n'}
            Click the link to activate your account, then log in to start managing bookings.
          </Text>
        </View>

        <PrimaryBtn label="Go to log in →" onPress={onLogin} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 1: Admin account details ────────────────────────────────────────────
function AccountStep({ onNext, defaultValues }: {
  onNext: (v: { firstName: string; lastName: string; email: string; password: string; phone: string }) => void;
  defaultValues: { firstName: string; lastName: string; email: string; password: string; phone: string };
}) {
  const [firstName, setFirstName] = useState(defaultValues.firstName);
  const [lastName, setLastName] = useState(defaultValues.lastName);
  const [email, setEmail] = useState(defaultValues.email);
  const [password, setPassword] = useState(defaultValues.password);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { anim, trigger } = useShake();

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    Keyboard.dismiss();
    if (!validate()) { trigger(); return; }
    onNext({ firstName, lastName, email, password, phone });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <ProgressBar current={1} total={3} />
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Your account details</ScreenTitle>
          <Sub style={{ marginBottom: 20 }}>This is your personal admin login for the agency.</Sub>

          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Field label="First name *">
                <TextInput
                  style={[inputStyle, fieldErrors.firstName && styles.inputError]}
                  value={firstName}
                  onChangeText={v => { setFirstName(v); setFieldErrors(p => ({ ...p, firstName: '' })); }}
                  autoCapitalize="words" placeholder="Ama"
                  placeholderTextColor={Colors.slateSoft} returnKeyType="next"
                />
                {fieldErrors.firstName ? <Text style={styles.fieldError}>{fieldErrors.firstName}</Text> : null}
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Last name *">
                <TextInput
                  style={[inputStyle, fieldErrors.lastName && styles.inputError]}
                  value={lastName}
                  onChangeText={v => { setLastName(v); setFieldErrors(p => ({ ...p, lastName: '' })); }}
                  autoCapitalize="words" placeholder="Boateng"
                  placeholderTextColor={Colors.slateSoft} returnKeyType="next"
                />
                {fieldErrors.lastName ? <Text style={styles.fieldError}>{fieldErrors.lastName}</Text> : null}
              </Field>
            </View>
          </View>

          <Field label="Email *">
            <TextInput
              style={[inputStyle, fieldErrors.email && styles.inputError]}
              value={email}
              onChangeText={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: '' })); }}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="you@email.com" placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
          </Field>

          <Field label="Phone *">
            <TextInput
              style={[inputStyle, fieldErrors.phone && styles.inputError]}
              value={phone}
              onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: '' })); }}
              keyboardType="phone-pad" placeholder="+233 24 000 0000"
              placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
          </Field>

          <Field label="Password * (min 8 chars)">
            <View style={styles.passwordRow}>
              <TextInput
                style={[inputStyle, styles.passwordInput, fieldErrors.password && styles.inputError]}
                value={password}
                onChangeText={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: '' })); }}
                secureTextEntry={!showPassword} placeholder="e.g. Abc@1234"
                placeholderTextColor={Colors.slateSoft} returnKeyType="done" onSubmitEditing={handleNext}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>
              Min 8 chars · uppercase · lowercase · number · special character
            </Text>
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

// ─── Step 2: Agency details ───────────────────────────────────────────────────
function AgencyStep({ onSubmit, onBack, loading }: {
  onSubmit: (v: { agencyName: string; agencyEmail: string; agencyPhone: string; agencyDescription: string }) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [agencyName, setAgencyName] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyDescription, setAgencyDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { anim, trigger } = useShake();

  function validate() {
    const e: Record<string, string> = {};
    if (!agencyName.trim()) e.agencyName = 'Agency name is required.';
    if (!agencyEmail.trim()) e.agencyEmail = 'Agency email is required.';
    else if (!/\S+@\S+\.\S+/.test(agencyEmail)) e.agencyEmail = 'Enter a valid email.';
    if (!agencyPhone.trim()) e.agencyPhone = 'Agency phone is required.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    Keyboard.dismiss();
    if (!validate()) { trigger(); return; }
    onSubmit({ agencyName, agencyEmail, agencyPhone, agencyDescription });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <BackBtn onPress={onBack} />
          <ProgressBar current={2} total={3} />
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Agency details</ScreenTitle>
          <Sub style={{ marginBottom: 20 }}>Tell families about your agency.</Sub>

          <Field label="Agency name *">
            <TextInput
              style={[inputStyle, fieldErrors.agencyName && styles.inputError]}
              value={agencyName}
              onChangeText={v => { setAgencyName(v); setFieldErrors(p => ({ ...p, agencyName: '' })); }}
              autoCapitalize="words" placeholder="e.g. Kelly Domfeh Home Care"
              placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.agencyName ? <Text style={styles.fieldError}>{fieldErrors.agencyName}</Text> : null}
          </Field>

          <Field label="Agency email *">
            <TextInput
              style={[inputStyle, fieldErrors.agencyEmail && styles.inputError]}
              value={agencyEmail}
              onChangeText={v => { setAgencyEmail(v); setFieldErrors(p => ({ ...p, agencyEmail: '' })); }}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="agency@email.com" placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.agencyEmail ? <Text style={styles.fieldError}>{fieldErrors.agencyEmail}</Text> : null}
          </Field>

          <Field label="Agency phone *">
            <TextInput
              style={[inputStyle, fieldErrors.agencyPhone && styles.inputError]}
              value={agencyPhone}
              onChangeText={v => { setAgencyPhone(v); setFieldErrors(p => ({ ...p, agencyPhone: '' })); }}
              keyboardType="phone-pad" placeholder="+233 30 000 0000"
              placeholderTextColor={Colors.slateSoft} returnKeyType="next"
            />
            {fieldErrors.agencyPhone ? <Text style={styles.fieldError}>{fieldErrors.agencyPhone}</Text> : null}
          </Field>

          <Field label="Description (optional)">
            <TextInput
              style={[inputStyle, { height: 88 }]}
              value={agencyDescription} onChangeText={setAgencyDescription}
              multiline textAlignVertical="top"
              placeholder="Describe your agency's services and experience…"
              placeholderTextColor={Colors.slateSoft} blurOnSubmit
            />
          </Field>

          {Object.keys(fieldErrors).length > 0 && (
            <ErrorBox message="Please fix the errors above." anim={anim} />
          )}

          <PrimaryBtn label="Create agency account →" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WorkerNoteScreen({ navigation }: Props) {
  type Step = 'account' | 'agency' | 'done';
  const [step, setStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [accountValues, setAccountValues] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  async function handleAgencySubmit(agency: {
    agencyName: string;
    agencyEmail: string;
    agencyPhone: string;
    agencyDescription: string;
  }) {
    setLoading(true);
    setGeneralError(null);
    try {
      await registerAgency({
        firstName: accountValues.firstName,
        lastName: accountValues.lastName,
        email: accountValues.email.trim().toLowerCase(),
        phone: accountValues.phone.trim(),
        password: accountValues.password,
        agencyName: agency.agencyName.trim(),
        agencyEmail: agency.agencyEmail.trim().toLowerCase(),
        agencyPhone: agency.agencyPhone.trim(),
        agencyDescription: agency.agencyDescription.trim(),
      });

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

      {step === 'account' ? (
        <AccountStep
          defaultValues={accountValues}
          onNext={vals => { setAccountValues(vals); setStep('agency'); }}
        />
      ) : (
        <AgencyStep
          onBack={() => setStep('account')}
          onSubmit={handleAgencySubmit}
          loading={loading}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.paper },
  container:   { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 16, paddingBottom: 48, flexGrow: 1 },
  nameRow:     { flexDirection: 'row', gap: 10 },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn:      { position: 'absolute', right: 13, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  inputError:  { borderColor: Colors.danger, borderWidth: 1.5 },
  fieldError:  { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.danger, marginTop: 4 },
  passwordHint: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slateSoft, marginTop: 5, lineHeight: 16 },
  errorBox:    { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  errorText:   { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, lineHeight: 19 },
  btn:         { width: '100%', backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4, shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  generalErrorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dangerBg, borderBottomWidth: 1, borderBottomColor: Colors.dangerBorder, paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 10 },
  generalErrorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, flex: 1 },
  verifyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 60 },
  verifyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.navyPale, borderWidth: 2, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  verifyCard:  { width: '100%', backgroundColor: Colors.navySubtle, borderWidth: 1, borderColor: Colors.line, borderRadius: 14, padding: 16, marginTop: 16, marginBottom: 28 },
  verifyTitle: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy, marginBottom: 6 },
  verifyBody:  { fontFamily: Fonts.inter, fontSize: 13.5, color: Colors.slate, lineHeight: 21, textAlign: 'center' },
  verifyEmail: { color: Colors.navy, fontFamily: Fonts.interBold },
});