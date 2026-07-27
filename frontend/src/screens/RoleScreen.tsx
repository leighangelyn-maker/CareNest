import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { RootStackParamList } from '../types';
import { BackBtn, Eyebrow, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Role'>;

export default function RoleScreen({ navigation }: Props) {
  const roles = [
    {
      label: 'I need household help',
      sub: 'Search, book and pay verified workers',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.8">
          <Path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
      onPress: () => navigation.navigate('Register'),
    },
    {
      label: "I'm looking for work",
      sub: 'Register as a nanny, cook, cleaner & more',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.8">
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
        </Svg>
      ),
      onPress: () => navigation.navigate('WorkerNote'),
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: Colors.paper }}
    >
      <BackBtn onPress={() => navigation.goBack()} />
      <Eyebrow>Step 1 of 2 · Account type</Eyebrow>
      <ScreenTitle>Which best describes you?</ScreenTitle>
      <Sub>
        This decides which app experience you'll see. You can't switch roles later
        without a separate verified account.
      </Sub>

      <View style={styles.cards}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.label}
            onPress={r.onPress}
            style={styles.card}
            activeOpacity={0.8}
          >
            <View style={styles.cardAvatar}>{r.icon}</View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{r.label}</Text>
              <Text style={styles.cardSub}>{r.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    paddingTop: 30,
    flexGrow: 1,
    backgroundColor: Colors.paper,
  },
  cards: {
    marginTop: 18,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontFamily: Fonts.interBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.navy,
  },
  cardSub: {
    fontFamily: Fonts.inter,
    fontSize: 11.5,
    color: Colors.slate,
    marginTop: 1,
  },
});
