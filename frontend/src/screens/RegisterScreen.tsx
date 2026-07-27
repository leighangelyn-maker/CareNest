import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { register as apiRegister } from '../api/auth';
import { BackBtn, Eyebrow, Field, ScreenTitle, Sub, inputStyle, CheckIcon } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit() {
    if (!firstName.trim()) { setError('Enter your first name.'); return; }
    if (!lastName.trim()) { setError('Enter your last name.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (!phone.trim()) { setError('Phone number is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

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
      // Registration succeeded — show success screen
      setRegistered(true);
    } catch (e: any) {
      const msg =
        e?.response?.data?.data?.error ??
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Registration success screen ──────────────────────────────────────────
  if (registered) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
        <ScrollView contentContainerStyle={[styles.container, { alignItems: 'center', paddingTop: 60 }]}>
          <View style={styles.successIcon}><CheckIcon /></View>
          <ScreenTitle>Account created!</ScreenTitle>
          <Sub style={{ textAlign: 'center', marginTop: 8 }}>
            Your CareNest account is ready.{'\n'}
            Log in with your email and password to get started.
          </Sub>

          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={[styles.btn, { marginTop: 32 }]}
          >
            <Text style={styles.btnText}>Log in now →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => navigation.navigate('Role')} />
        <Eyebrow>Create account · Family</Eyebrow>
        <ScreenTitle>Set up your family account</ScreenTitle>
        <Sub>Find and book verified domestic agencies near you.</Sub>

        <Field label="First name">
          <TextInput
            style={inputStyle} value={firstName} onChangeText={setFirstName}
            autoCapitalize="words" placeholder="Adjoa" placeholderTextColor={Colors.slateSoft}
          />
        </Field>
        <Field label="Last name">
          <TextInput
            style={inputStyle} value={lastName} onChangeText={setLastName}
            autoCapitalize="words" placeholder="Owusu" placeholderTextColor={Colors.slateSoft}
          />
        </Field>
        <Field label="Email">
          <TextInput
            style={inputStyle} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            placeholder="you@email.com" placeholderTextColor={Colors.slateSoft}
          />
        </Field>
        <Field label="Phone">
          <TextInput
            style={inputStyle} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" placeholder="+233 24 000 0000" placeholderTextColor={Colors.slateSoft}
          />
        </Field>
        <Field label="Password (min 8 chars, upper + lower + digit + special)">
          <TextInput
            style={inputStyle} value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.slateSoft}
          />
        </Field>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit} disabled={loading}
          style={[styles.btn, loading && { opacity: 0.6 }]} activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={Colors.goldLight} />
            : <Text style={styles.btnText}>Create account →</Text>}
        </TouchableOpacity>

        <Text style={styles.loginHint}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Log in</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SCREEN_H_PADDING, paddingTop: 26, paddingBottom: 40 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.successBg, borderWidth: 2, borderColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, fontFamily: Fonts.inter, lineHeight: 19 },
  btn: { width: '100%', backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  loginHint: { textAlign: 'center', marginTop: 20, fontSize: 13, color: Colors.slate, fontFamily: Fonts.inter },
  loginLink: { color: Colors.navy, fontFamily: Fonts.interBold },
});
