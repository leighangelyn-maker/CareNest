import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { Btn, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerified'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Status = 'loading' | 'success' | 'already_verified' | 'expired' | 'error';

function SuccessIcon() {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[styles.iconBox, styles.iconSuccess, { transform: [{ scale }] }]}>
      <Svg width={38} height={38} viewBox="0 0 24 24" fill="none"
        stroke={Colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="20 6 9 17 4 12" />
      </Svg>
    </Animated.View>
  );
}

function ErrorIcon() {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[styles.iconBox, styles.iconError, { transform: [{ scale }] }]}>
      <Svg width={38} height={38} viewBox="0 0 24 24" fill="none"
        stroke={Colors.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18M6 6l12 12" />
      </Svg>
    </Animated.View>
  );
}

function LoadingIcon() {
  return (
    <View style={[styles.iconBox, styles.iconLoading]}>
      <Svg width={34} height={34} viewBox="0 0 24 24" fill="none"
        stroke={Colors.navy} strokeWidth="2" strokeLinecap="round">
        <Circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
        <Path d="M12 3a9 9 0 019 9" />
      </Svg>
    </View>
  );
}

export default function EmailVerifiedScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verify();
  }, [token]);

  async function verify() {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please try clicking the link in your email again.');
      return;
    }

    try {
      await apiClient.get('/auth/verify-email', { params: { token } });
      setStatus('success');
    } catch (e: any) {
      const msg: string =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ?? '';

      if (msg.toLowerCase().includes('already')) {
        setStatus('already_verified');
      } else if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('invalid')
      ) {
        setStatus('expired');
        setMessage(msg);
      } else {
        setStatus('error');
        setMessage(msg || 'Something went wrong. Please try again.');
      }
    }
  }

  const content: Record<Status, {
    icon: React.ReactNode;
    title: string;
    body: string;
    cta: string;
    onCta: () => void;
    secondary?: { label: string; onPress: () => void };
  }> = {
    loading: {
      icon: <LoadingIcon />,
      title: 'Verifying your email…',
      body: 'Just a moment while we confirm your email address.',
      cta: '',
      onCta: () => {},
    },
    success: {
      icon: <SuccessIcon />,
      title: 'Email verified!',
      body: 'Your CareNest account is now active. You can log in and start booking trusted domestic help.',
      cta: 'Log in now →',
      onCta: () => navigation.replace('Login'),
    },
    already_verified: {
      icon: <SuccessIcon />,
      title: 'Already verified',
      body: 'This email address has already been verified. Go ahead and log in.',
      cta: 'Log in →',
      onCta: () => navigation.replace('Login'),
    },
    expired: {
      icon: <ErrorIcon />,
      title: 'Link expired',
      body: `Verification links are valid for 24 hours. This one has expired — request a new one from the login screen.\n\n${message}`.trim(),
      cta: 'Go to log in',
      onCta: () => navigation.replace('Login'),
    },
    error: {
      icon: <ErrorIcon />,
      title: 'Verification failed',
      body: message || 'We could not verify your email. Please request a new verification link.',
      cta: 'Go to log in',
      onCta: () => navigation.replace('Login'),
    },
  };

  const c = content[status];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {c.icon}

        <ScreenTitle
          size={SCREEN_WIDTH < 360 ? 20 : 24}
          style={styles.title}
        >
          {c.title}
        </ScreenTitle>

        <Sub style={styles.body}>{c.body}</Sub>

        {status !== 'loading' && c.cta ? (
          <View style={styles.cta}>
            <Btn onPress={c.onCta}>{c.cta}</Btn>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
  },

  // Icon containers
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
  },
  iconSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  iconError: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  iconLoading: {
    backgroundColor: Colors.navyPale,
    borderColor: Colors.line,
  },

  title: {
    textAlign: 'center',
    marginBottom: 0,
  },
  body: {
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  cta: {
    marginTop: 32,
    width: '100%',
  },
});
