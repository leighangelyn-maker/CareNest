import React from 'react';
import { Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Btn, ScreenTitle, Sub } from '../components/atoms';
// import CareNestLogo from '../components/CareNestLogo';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_HEIGHT < 700;

// ─── Decorative warm blobs ────────────────────────────────────────────────────
function HeroDeco() {
  return (
    <View style={decoStyles.wrap} pointerEvents="none">
      {/* Soft gold ring top-right */}
      <Svg style={decoStyles.ringTR} width={180} height={180} viewBox="0 0 180 180">
        <Circle cx="90" cy="90" r="80" fill="none" stroke={Colors.gold} strokeWidth="1" opacity="0.18" />
        <Circle cx="90" cy="90" r="55" fill="none" stroke={Colors.gold} strokeWidth="0.6" opacity="0.12" />
      </Svg>
      {/* Warm cream blob bottom-left */}
      <Svg style={decoStyles.blobBL} width={140} height={140} viewBox="0 0 140 140">
        <Circle cx="70" cy="70" r="65" fill={Colors.cream} opacity="0.55" />
      </Svg>
      {/* Tiny dot accent */}
      <View style={decoStyles.dot1} />
      <View style={decoStyles.dot2} />
    </View>
  );
}

const decoStyles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  ringTR: { position: 'absolute', top: -40, right: -40 },
  blobBL: { position: 'absolute', bottom: 60, left: -30 },
  dot1: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.gold, opacity: 0.3, top: '35%', right: 32,
  },
  dot2: {
    position: 'absolute', width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.gold, opacity: 0.22, top: '50%', right: 60,
  },
});

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <HeroDeco />

        {/* Logo — big and centred */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/carenest-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ScreenTitle
          size={isSmall ? 19 : 23}
          style={styles.headline}
        >
          Verified household help,{'\n'}on your terms
        </ScreenTitle>

        <Sub style={styles.sub}>
          Nannies, cooks, cleaners, caregivers, drivers and gardeners —
          every one ID-checked and background-verified.
        </Sub>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Btn onPress={() => navigation.navigate('Role')}>Get started →</Btn>

        <Text style={styles.loginHint}>
          Already have an account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            Log in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: isSmall ? 12 : 24,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 24,
  },
  logoWrap: {
    marginBottom: isSmall ? 20 : 30,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  headline: {
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: isSmall ? 27 : 33,
  },
  sub: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    alignSelf: 'stretch', 
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: isSmall ? 24 : 36,
    gap: 0,
  },
  loginHint: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
    color: Colors.slate,
    fontFamily: Fonts.inter,
    lineHeight: 20,
  },
  loginLink: {
    color: Colors.navy,
    fontFamily: Fonts.interBold,
  },
});