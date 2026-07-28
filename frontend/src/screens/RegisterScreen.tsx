import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { register as apiRegister } from '../api/auth';
import {
  BackBtn,
  Field,
  ScreenTitle,
  Sub,
  inputStyle,
  Btn,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={progressStyles.wrapper}>
      <View style={progressStyles.track}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              progressStyles.segment,
              i < current ? progressStyles.segmentFilled : progressStyles.segmentEmpty,
              i < total - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>
      <Text style={progressStyles.label}>
        Step {current} of {total}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
    height: 6,
  },
  segmentFilled: { backgroundColor: Colors.navy },
  segmentEmpty: { backgroundColor: Colors.line },
  label: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.gold,
  },
});

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessView({ onLogin }: { onLogin: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.successContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}
        >
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        </Animated.View>

        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Account created!</ScreenTitle>

        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Check your email</Text>
          <Text style={styles.verificationBody}>
            A verification link has been sent to your email address. Click the link to activate your account, then come back here to log in.
          </Text>
        </View>

        <View style={styles.phoneCard}>
          <Text style={styles.phoneTitle}>📱 Phone number</Text>
          <Text style={styles.phoneBody}>
            Your phone number is saved to your profile. Agencies may use it to reach you directly once a booking is confirmed — no separate OTP step needed.
          </Text>
        </View>

        <Btn onPress={onLogin}>Go to log in →</Btn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registered, setRegistered] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!validate()) { triggerShake(); return; }
    setLoading(true);
    setError(null);
    try {
      await apiRegister({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      setRegistered(true);
    } catch (e: any) {
      const msg =
        e?.response?.data?.data?.error ??
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'Registration failed. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return <SuccessView onLogin={() => navigation.replace('Login')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackBtn onPress={() => navigation.navigate('Role')} />

            {/* Progress */}
            <StepProgress current={2} total={3} />

            <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>
              Set up your family account
            </ScreenTitle>
            <Sub style={{ marginBottom: 20 }}>
              Find and book verified domestic agencies near you.
            </Sub>

            {/* ── First + Last name row ──────────────────────────────── */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Field label="First name *">
                  <TextInput
                    style={[inputStyle, fieldErrors.firstName && styles.inputError]}
                    value={firstName}
                    onChangeText={(v) => { setFirstName(v); setFieldErrors(p => ({ ...p, firstName: '' })); }}
                    autoCapitalize="words"
                    placeholder="Adjoa"
                    placeholderTextColor={Colors.slateSoft}
                    returnKeyType="next"
                  />
                  {fieldErrors.firstName ? (
                    <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
                  ) : null}
                </Field>
              </View>

              <View style={styles.nameField}>
                <Field label="Last name *">
                  <TextInput
                    style={[inputStyle, fieldErrors.lastName && styles.inputError]}
                    value={lastName}
                    onChangeText={(v) => { setLastName(v); setFieldErrors(p => ({ ...p, lastName: '' })); }}
                    autoCapitalize="words"
                    placeholder="Owusu"
                    placeholderTextColor={Colors.slateSoft}
                    returnKeyType="next"
                  />
                  {fieldErrors.lastName ? (
                    <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
                  ) : null}
                </Field>
              </View>
            </View>

            {/* Email */}
            <Field label="Email *">
              <TextInput
                style={[inputStyle, fieldErrors.email && styles.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); setFieldErrors(p => ({ ...p, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@email.com"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="next"
              />
              {fieldErrors.email ? (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </Field>

            {/* Phone */}
            <Field label="Phone *">
              <TextInput
                style={[inputStyle, fieldErrors.phone && styles.inputError]}
                value={phone}
                onChangeText={(v) => { setPhone(v); setFieldErrors(p => ({ ...p, phone: '' })); }}
                keyboardType="phone-pad"
                placeholder="+233 24 000 0000"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="next"
              />
              {fieldErrors.phone ? (
                <Text style={styles.fieldError}>{fieldErrors.phone}</Text>
              ) : null}
            </Field>

            {/* Password with eye toggle */}
            <Field label="Password * (min 8 chars)">
              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle, styles.passwordInput, fieldErrors.password && styles.inputError]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setFieldErrors(p => ({ ...p, password: '' })); }}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.slateSoft}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                >
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </Field>

            {/* General error */}
            {error ? (
              <Animated.View
                style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Submit */}
            <Btn
              onPress={handleSubmit}
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </Btn>

            <Text style={styles.loginHint}>
              Already have an account?{' '}
              <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                Log in
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 48,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  nameField: { flex: 1 },

  // Password
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn: {
    position: 'absolute',
    right: 13,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Validation
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  fieldError: {
    fontFamily: Fonts.inter,
    fontSize: 11.5,
    color: Colors.danger,
    marginTop: 4,
  },

  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 19,
  },

  loginHint: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    color: Colors.slate,
    fontFamily: Fonts.inter,
  },
  loginLink: { color: Colors.navy, fontFamily: Fonts.interBold },

  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 60,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successBg,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verificationCard: {
    width: '100%',
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    marginBottom: 28,
  },
  verificationTitle: {
    fontFamily: Fonts.interBold,
    fontSize: 14,
    color: Colors.navy,
    marginBottom: 6,
  },
  verificationBody: {
    fontFamily: Fonts.inter,
    fontSize: 13.5,
    color: Colors.slate,
    lineHeight: 21,
  },
  phoneCard: {
    width: '100%',
    backgroundColor: Colors.navyPale,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 28,
  },
  phoneTitle: {
    fontFamily: Fonts.interBold,
    fontSize: 14,
    color: Colors.navy,
    marginBottom: 6,
  },
  phoneBody: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.slate,
    lineHeight: 20,
  },
});
