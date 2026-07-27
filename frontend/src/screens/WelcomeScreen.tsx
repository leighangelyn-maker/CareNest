import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Btn, ScreenTitle, Sub } from '../components/atoms';
import CareNestLogo from '../components/CareNestLogo';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <CareNestLogo size={SCREEN_HEIGHT < 700 ? 100 : 130} showText />
        </View>
        <ScreenTitle size={SCREEN_HEIGHT < 700 ? 20 : 24} style={styles.headline}>
          Verified household help, on your terms
        </ScreenTitle>
        <Sub style={styles.sub}>
          Nannies, cooks, cleaners, caregivers, drivers and gardeners — every one
          ID-checked and background-verified.
        </Sub>
      </View>

      <View style={styles.footer}>
        <Btn onPress={() => navigation.navigate('Role')}>Get started →</Btn>
        <Text style={styles.loginHint}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            Log in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20,
  },
  logoWrap: { marginBottom: 24 },
  headline: { textAlign: 'center', marginBottom: 10 },
  sub: { textAlign: 'center' },
  footer: { padding: SCREEN_H_PADDING, paddingBottom: 32 },
  loginHint: { textAlign: 'center', marginTop: 16, fontSize: 12.5, color: Colors.slate, fontFamily: Fonts.inter },
  loginLink: { color: Colors.navy, fontFamily: Fonts.interBold },
});
