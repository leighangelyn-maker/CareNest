import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { BackBtn, ProgressBar, ScreenTitle, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Role'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoleScreen({ navigation }: Props) {
  const roles = [
    {
      label: 'I need household help',
      sub: 'Search, book and pay verified workers',
      icon: (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.8">
          <Path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
      onPress: () => navigation.navigate('Register'),
    },
    {
      label: 'I provide domestic services',
      sub: 'Register your agency and get booked by families',
      icon: (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.8">
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
        </Svg>
      ),
      onPress: () => navigation.navigate('WorkerNote'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackBtn onPress={() => navigation.goBack()} />

        {/* Progress indicator — Step 1 of 3 */}
        <ProgressBar current={1} total={3} />

        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>
          Which best describes you?
        </ScreenTitle>
        <Sub style={{ marginBottom: 24 }}>
          This decides which experience you'll see. You can't switch roles later
          without a separate verified account.
        </Sub>

        <View style={styles.cards}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.label}
              onPress={r.onPress}
              style={styles.card}
              activeOpacity={0.82}
            >
              <View style={styles.cardAvatar}>{r.icon}</View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{r.label}</Text>
                <Text style={styles.cardSub}>{r.sub}</Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.slateSoft} strokeWidth="2" strokeLinecap="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardAvatar: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardName: {
    fontFamily: Fonts.interBold,
    fontSize: 14,
    color: Colors.navy,
    marginBottom: 3,
  },
  cardSub: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Colors.slate,
    lineHeight: 17,
  },
});
