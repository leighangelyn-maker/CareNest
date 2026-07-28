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
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import {
  Field, ScreenTitle, Sub, inputStyle, Btn,
} from '../components/atoms';
import CareNestLogo from '../components/CareNestLogo';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

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

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Shake animation for error
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

  async function handleLogin() {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const raw: string =
        e?.response?.data?.message ??
        e?.response?.data?.data?.error ??
        e?.response?.data?.error ??
        e?.message ?? '';
      const lower = raw.toLowerCase();

      if (
        status === 409 ||
        lower.includes('not verified') ||
        lower.includes('verify your email') ||
        lower.includes('pending_verification') ||
        lower.includes('pending verification')
      ) {
        setUnverifiedEmail(email.trim().toLowerCase());
        setError(
          'Your email address has not been verified yet.\n\nPlease check your inbox for the verification link, then try logging in again.',
        );
      } else if (
        status === 401 ||
        status === 400 ||
        lower.includes('invalid email or password') ||
        lower.includes('invalid credentials') ||
        lower.includes('incorrect') ||
        lower.includes('wrong') ||
        lower.includes('not found') ||
        lower.includes('no user')
      ) {
        setError(
          'Incorrect email address or password. Please check your details and try again.',
        );
      } else {
        // Show the raw backend message when it's specific enough, otherwise generic
        setError(
          raw.length > 0 && raw.length < 200
            ? raw
            : 'Login failed. Please try again.',
        );
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMsg(null);
    try {
      await apiClient.post('/auth/resend-verification', null, {
        params: { email: unverifiedEmail },
      });
      setResendMsg('Verification email resent. Check your inbox.');
    } catch (e: any) {
      setResendMsg(e?.response?.data?.error ?? 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
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
            {/* Logo */}
            <View style={styles.header}>
              <View style={styles.logoWrap}>
                <CareNestLogo size={isSmallScreen ? 72 : 90} showText />
              </View>
              <Sub style={{ textAlign: 'center' }}>Sign in to your CareNest account.</Sub>
            </View>

            {/* Email */}
            <Field label="Email">
              <TextInput
                style={inputStyle}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@email.com"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="next"
              />
            </Field>

            {/* Password with eye toggle */}
            <Field label="Password">
              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle, styles.passwordInput]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(null); }}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.slateSoft}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
            </Field>

            {/* Error (shake animation) */}
            {error ? (
              <Animated.View
                style={[
                  styles.errorBox,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Resend verification */}
            {unverifiedEmail ? (
              <View style={styles.resendRow}>
                <Text style={styles.resendHint}>
                  Check your inbox for the verification link. Once you tap it, come back here to log in.
                </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  style={styles.resendBtn}
                  activeOpacity={0.7}
                >
                  {resending ? (
                    <ActivityIndicator color={Colors.navy} size="small" />
                  ) : (
                    <Text style={styles.resendText}>Resend verification email</Text>
                  )}
                </TouchableOpacity>
                {resendMsg ? (
                  <Text
                    style={[
                      styles.resendMsg,
                      { color: resendMsg.includes('resent') ? Colors.success : Colors.danger },
                    ]}
                  >
                    {resendMsg}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Login button */}
            <Btn
              onPress={handleLogin}
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading ? 'Signing in…' : 'Log in →'}
            </Btn>

            <Text style={styles.hint}>
              New to CareNest?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Role')}>
                Create an account
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: isSmallScreen ? 16 : 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 28,
  },
  logoWrap: { marginBottom: isSmallScreen ? 8 : 14 },

  // Password field
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

  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 19,
  },

  // Resend
  resendRow: { marginBottom: 12, gap: 6 },
  resendHint: {
    fontFamily: Fonts.inter,
    fontSize: 12.5,
    color: Colors.slate,
    lineHeight: 18,
    marginBottom: 4,
  },
  resendBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  resendText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 13,
    color: Colors.navy,
    textDecorationLine: 'underline',
  },
  resendMsg: {
    fontFamily: Fonts.inter,
    fontSize: 12.5,
    lineHeight: 18,
  },

  hint: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    color: Colors.slate,
    fontFamily: Fonts.inter,
  },
  link: { color: Colors.navy, fontFamily: Fonts.interBold },
});
