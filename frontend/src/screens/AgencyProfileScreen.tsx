import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AgencySummary, AgencyProfile } from '../types';
import { getAgency } from '../api/agencies';
import { Avatar, BackBtn, Btn, Eyebrow, ScreenTitle, StarIcon, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgencyProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock reviews per agency
const MOCK_REVIEWS: Record<string, { name: string; rating: number; comment: string; date: string }[]> = {
  default: [
    { name: 'Adjoa M.', rating: 5, comment: 'Excellent service! The nanny was punctual, caring and great with my kids. Highly recommend.', date: '12 Jul 2026' },
    { name: 'Kwame A.', rating: 5, comment: 'Very professional agency. Worker arrived on time and did a thorough job. Will book again.', date: '5 Jul 2026' },
    { name: 'Ama S.', rating: 4, comment: 'Good experience overall. The cleaner was efficient and brought their own supplies.', date: '28 Jun 2026' },
    { name: 'Kofi B.', rating: 5, comment: 'Our elderly mother was in great hands. The caregiver was gentle, patient and experienced.', date: '20 Jun 2026' },
    { name: 'Akosua D.', rating: 4, comment: 'Great cook — made local dishes exactly how we like. Very hygienic too.', date: '14 Jun 2026' },
  ],
};

function getReviews(agencyId: string) {
  return MOCK_REVIEWS[agencyId] ?? MOCK_REVIEWS.default;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <StarIcon key={i} filled={i <= rating} />
      ))}
    </View>
  );
}

export default function AgencyProfileScreen({ navigation, route }: Props) {
  const { agency: summary } = route.params;
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgency(summary.id);
      setProfile(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load agency profile');
    } finally {
      setLoading(false);
    }
  }

  const display = profile ?? (summary as AgencyProfile);
  const isAccepting = profile?.isAcceptingBookings ?? true;
  const reviews = getReviews(summary.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BackBtn onPress={() => navigation.goBack()} />

        {/* Hero */}
        <View style={styles.hero}>
          <Avatar name={display.name} size={SCREEN_WIDTH < 360 ? 52 : 64} />
          <View style={styles.heroInfo}>
            <Eyebrow>{display.city}</Eyebrow>
            <ScreenTitle size={SCREEN_WIDTH < 360 ? 18 : 22}>{display.name}</ScreenTitle>
          </View>
        </View>

        {/* Rating + status */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingPill}>
            <StarIcon filled />
            <Text style={styles.ratingText}>
              {typeof display.averageRating === 'number' ? display.averageRating.toFixed(1) : '—'}
            </Text>
          </View>
          <Text style={styles.reviewCount}>{display.totalReviews ?? reviews.length} reviews</Text>
          <View style={[styles.badge, isAccepting ? styles.badgeGreen : styles.badgeGrey]}>
            <Text style={[styles.badgeText, isAccepting ? styles.badgeTextGreen : styles.badgeTextGrey]}>
              {isAccepting ? '✓ Accepting bookings' : 'Paused'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={Colors.navy} /></View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadProfile} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {display.description ? (
              <View style={styles.section}><Sub>{display.description}</Sub></View>
            ) : null}

            {profile?.categories && profile.categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services offered</Text>
                <View style={styles.chipRow}>
                  {profile.categories.map((cat) => (
                    <View key={cat} style={styles.chip}>
                      <Text style={styles.chipText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client reviews</Text>
              {reviews.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{r.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{r.name}</Text>
                      <Text style={styles.reviewDate}>{r.date}</Text>
                    </View>
                    <StarRow rating={r.rating} />
                  </View>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* CTA */}
        <View style={styles.ctaBox}>
          {isAccepting ? (
            <Btn onPress={() => navigation.navigate('BookAgency', { agency: display })}>
              Book this agency →
            </Btn>
          ) : (
            <Btn onPress={() => {}} variant="ghost">
              Not accepting bookings right now
            </Btn>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { padding: SCREEN_H_PADDING, paddingTop: 14, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroInfo: { flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.navyPale, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  ratingText: { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.navy },
  reviewCount: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slate },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100 },
  badgeGreen: { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: 'rgba(47,107,79,0.2)' },
  badgeGrey: { backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: Colors.line },
  badgeText: { fontFamily: Fonts.interSemiBold, fontSize: 10.5 },
  badgeTextGreen: { color: Colors.success },
  badgeTextGrey: { color: Colors.slate },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: { paddingVertical: 20, alignItems: 'center', gap: 10 },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.navyPale },
  retryText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: Colors.navyPale, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  reviewCard: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 12,
    padding: 12, marginBottom: 10, backgroundColor: Colors.paper,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontFamily: Fonts.interBold, fontSize: 13, color: Colors.goldLight },
  reviewName: { fontFamily: Fonts.interBold, fontSize: 13, color: Colors.navy },
  reviewDate: { fontFamily: Fonts.inter, fontSize: 10.5, color: Colors.slateSoft },
  reviewComment: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 19 },
  ctaBox: { marginTop: 20 },
});
