import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import { Eyebrow, Field, ScreenTitle, Sub, inputStyle } from '../components/atoms';
import CareNestLogo from '../components/CareNestLogo';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.replace('MainTabs');
    } catch (e: any) {
      const status = e?.response?.status;
      // Backend error: { data: null, message: "..." }
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? '';
      if (status === 409 || msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('verify')) {
        setUnverifiedEmail(email.trim().toLowerCase());
        setError('Your email is not verified. Check your inbox or resend the link.');
      } else if (status === 401 || status === 400 || msg.toLowerCase().includes('invalid')) {
        setError('Incorrect email or password.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMsg(null);
    try {
      await apiClient.post('/auth/resend-verification', null, { params: { email: unverifiedEmail } });
      setResendMsg('Verification email resent. Check your inbox.');
    } catch (e: any) {
      setResendMsg(e?.response?.data?.error ?? 'Failed to resend.');
    } finally {
      setResending(false);
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) { setForgotMsg('Enter your email address.'); return; }
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      setForgotMsg('If that email is registered, a reset link has been sent.');
    } catch {
      setForgotMsg('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Forgot password screen ───────────────────────────────────────────────
  if (showForgot) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => { setShowForgot(false); setForgotMsg(null); }} style={styles.backRow}>
            <Text style={styles.backText}>← Back to login</Text>
          </TouchableOpacity>
          <Eyebrow>Password reset</Eyebrow>
          <ScreenTitle>Reset your password</ScreenTitle>
          <Sub>Enter your registered email and we'll send you a reset link.</Sub>

          <Field label="Email">
            <TextInput style={inputStyle} value={forgotEmail} onChangeText={setForgotEmail}
              keyboardType="email-address" autoCapitalize="none"
              placeholder="you@email.com" placeholderTextColor={Colors.slateSoft} />
          </Field>

          {forgotMsg ? (
            <Text style={[styles.errorText, { color: forgotMsg.includes('sent') ? Colors.success : Colors.danger }]}>
              {forgotMsg}
            </Text>
          ) : null}

          <TouchableOpacity onPress={handleForgotPassword} disabled={forgotLoading}
            style={[styles.btn, forgotLoading && { opacity: 0.6 }]}>
            {forgotLoading
              ? <ActivityIndicator color={Colors.goldLight} />
              : <Text style={styles.btnText}>Send reset link</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Login form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <CareNestLogo size={isSmallScreen ? 80 : 100} showText />
          </View>
          <Sub>Sign in to your CareNest account.</Sub>
        </View>

        <Field label="Email">
          <TextInput style={inputStyle} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="you@email.com" placeholderTextColor={Colors.slateSoft} />
        </Field>
        <Field label="Password">
          <TextInput style={inputStyle} value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.slateSoft} />
        </Field>

        <TouchableOpacity onPress={() => { setShowForgot(true); setForgotEmail(email); }}
          style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Resend verification if email not verified */}
        {unverifiedEmail ? (
          <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
            {resending
              ? <ActivityIndicator color={Colors.navy} size="small" />
              : <Text style={styles.resendText}>Resend verification email</Text>}
          </TouchableOpacity>
        ) : null}
        {resendMsg ? (
          <Text style={[styles.errorText, { color: resendMsg.includes('resent') ? Colors.success : Colors.danger }]}>
            {resendMsg}
          </Text>
        ) : null}

        <TouchableOpacity onPress={handleLogin} disabled={loading}
          style={[styles.btn, loading && { opacity: 0.6 }]}>
          {loading ? <ActivityIndicator color={Colors.goldLight} /> : <Text style={styles.btnText}>Log in →</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>
          New to Care Nest?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Role')}>Create an account</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SCREEN_H_PADDING, paddingTop: isSmallScreen ? 16 : 32, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: isSmallScreen ? 12 : 20 },
  logoWrap: { marginBottom: isSmallScreen ? 8 : 14 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 8 },
  forgotText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, fontFamily: Fonts.inter, lineHeight: 19 },
  resendBtn: { alignSelf: 'center', marginBottom: 8, paddingVertical: 6 },
  resendText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy, textDecorationLine: 'underline' },
  btn: { width: '100%', backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  hint: { textAlign: 'center', marginTop: 16, fontSize: 12.5, color: Colors.slate, fontFamily: Fonts.inter },
  link: { color: Colors.navy, fontFamily: Fonts.interBold },
  backRow: { marginBottom: 24 },
  backText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
});
