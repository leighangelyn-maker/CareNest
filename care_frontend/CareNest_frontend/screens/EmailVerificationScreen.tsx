import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView
} from 'react-native';
import { resendVerification } from '../services/api';

export default function EmailVerificationScreen({ route, navigation }: any) {
  const email: string = route.params?.email ?? '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await resendVerification(email);
      setMessage('Verification email sent.');
      setCooldown(30);
    } catch (err: any) {
      setMessage(err.message || 'Could not resend right now.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.instructions}>
          Tap the link in that email to verify your account. Once verified, come back and log in.
        </Text>

        {message && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resending || cooldown > 0}>
          <Text style={[styles.link, (resending || cooldown > 0) && styles.linkDisabled]}>
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Didn't get it? Resend email"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:          { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  body:           { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  email:          { fontWeight: 'bold', color: '#0D1B2A' },
  instructions:   { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 20, lineHeight: 19, paddingHorizontal: 8 },
  message:        { marginTop: 16, fontSize: 13, color: '#0D1B2A', textAlign: 'center' },
  button:         { width: '100%', backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonText:     { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  link:           { color: '#0D1B2A', fontSize: 14, fontWeight: '600', marginTop: 20 },
  linkDisabled:   { color: '#999' },
});