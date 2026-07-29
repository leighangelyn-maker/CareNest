import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  BackBtn,
  Btn,
  Divider,
  SectionLabel,
  Sub,
  Verified,
  initials,
} from '../components/atoms';
import { Colors, Fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { worker } = route.params;

  // Parse availability chips from comma-separated string
  const availabilityChips = worker.availableDays
    ? worker.availableDays.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  const reviews = [
    {
      name: 'Efua T.',
      text: 'Punctual, gentle with the kids, and sends updates during the day. Booked her three times now.',
    },
    {
      name: 'Kwame O.',
      text: "Verification badge made me comfortable letting her in while we're at work.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <BackBtn onPress={() => navigation.goBack()} dark />
        <View style={styles.heroId}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials(worker.name)}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.profileName}>{worker.name}</Text>
            <Text style={styles.profileRole}>
              {worker.serviceType} · {worker.experienceYears} yrs experience
            </Text>
            {worker.isVerified && (
              <View style={{ marginTop: 8 }}>
                <Verified />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats strip */}
      <View style={styles.statStrip}>
        {[
          { num: worker.avgRating.toFixed(1), lab: 'Rating' },
          { num: worker.totalRatings.toString(), lab: 'Bookings' },
          { num: `₵${worker.hourlyRate}/hr`, lab: 'Rate' },
        ].map((s, i, arr) => (
          <View
            key={s.lab}
            style={[styles.stat, i < arr.length - 1 && styles.statBorder]}
          >
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLab}>{s.lab}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.content}>
          <SectionLabel>About</SectionLabel>
          <Sub>{worker.bio}</Sub>

          <SectionLabel>Skills & availability</SectionLabel>
          <View style={styles.skills}>
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>{worker.experienceYears} yrs experience</Text>
            </View>
            {availabilityChips.map((chip) => (
              <View key={chip} style={styles.skillTag}>
                <Text style={styles.skillText}>{chip}</Text>
              </View>
            ))}
          </View>

          <SectionLabel>Reviews ({worker.totalRatings})</SectionLabel>
          {reviews.map((r) => (
            <View key={r.name} style={styles.review}>
              <View style={styles.reviewHead}>
                <Text style={styles.reviewName}>{r.name}</Text>
                <Text style={{ color: Colors.gold, fontSize: 12 }}>★★★★★</Text>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <View>
          <Text style={styles.ctaRate}>₵{worker.hourlyRate}</Text>
          <Text style={styles.ctaRateSub}>/ hour</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Btn
            onPress={() => navigation.navigate('BookAgency', {
              agency: {
                id: worker.workerId != null ? String(worker.workerId) : 'worker-direct',
                name: worker.name,
                city: worker.location ?? 'Ghana',
                slug: worker.name.toLowerCase().replace(/\s+/g, '-'),
                averageRating: worker.avgRating ?? 0,
                totalReviews: worker.totalRatings ?? 0,
                logoUrl: null,
              },
            })}
          >
            Request booking
          </Btn>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  hero: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 26,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: Colors.goldTintSubtle,
  },
  heroId: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.goldTint,
    borderWidth: 1.5,
    borderColor: Colors.goldTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileInitials: {
    fontFamily: Fonts.interBold,
    fontSize: 24,
    color: Colors.goldLight,
  },
  heroInfo: { flex: 1 },
  profileName: {
    fontFamily: Fonts.interBold,
    fontSize: 19,
    color: Colors.paper,
  },
  profileRole: {
    fontSize: 12,
    color: Colors.goldLight,
    marginTop: 2,
    fontFamily: Fonts.inter,
  },
  statStrip: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.line,
  },
  statNum: {
    fontFamily: Fonts.interBold,
    fontSize: 17,
    color: Colors.navy,
  },
  statLab: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9.5,
    color: Colors.slateSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: Colors.navyPale,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  skillText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12,
    color: Colors.navy,
  },
  review: {
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewName: {
    fontFamily: Fonts.interBold,
    fontSize: 12,
    color: Colors.navy,
  },
  reviewText: {
    fontFamily: Fonts.inter,
    fontSize: 12.5,
    color: Colors.slate,
    marginTop: 4,
    lineHeight: 19,
  },
  cta: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.paper,
  },
  ctaRate: {
    fontFamily: Fonts.interBold,
    fontSize: 17,
    color: Colors.navy,
  },
  ctaRateSub: {
    fontFamily: Fonts.inter,
    fontSize: 9.5,
    color: Colors.slateSoft,
  },
});
