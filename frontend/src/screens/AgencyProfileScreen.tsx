import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AgencySummary, AgencyProfile } from '../types';
import { getAgency } from '../api/agencies';
import { Avatar, BackBtn, Btn, StarIcon, Sub } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgencyProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_REVIEWS: Record<string, { name: string; rating: number; comment: string; date: string }[]> = {
  default: [
    { name: 'Adjoa M.', rating: 5, comment: 'Excellent service! The nanny was punctual, caring and great with my kids. Highly recommend.', date: '12 Jul 2026' },
    { name: 'Kwame A.', rating: 5, comment: 'Very professional agency. Worker arrived on time and did a thorough job. Will book again.', date: '5 Jul 2026' },
    { name: 'Ama S.',   rating: 4, comment: 'Good experience overall. The cleaner was efficient and brought their own supplies.', date: '28 Jun 2026' },
    { name: 'Kofi B.',  rating: 5, comment: 'Our elderly mother was in great hands. The caregiver was gentle, patient and experienced.', date: '20 Jun 2026' },
    { name: 'Akosua D.',rating: 4, comment: 'Great cook — made local dishes exactly how we like. Very hygienic too.', date: '14 Jun 2026' },
  ],
};
function getReviews(id: string) { return MOCK_REVIEWS[id] ?? MOCK_REVIEWS.default; }

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= rating} />)}
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
    setLoading(true); setError(null);
    try { setProfile(await getAgency(summary.id)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load agency profile'); }
    finally { setLoading(false); }
  }

  const display     = profile ?? (summary as AgencyProfile);
  const isAccepting = profile?.isAcceptingBookings ?? true;
  const reviews     = getReviews(summary.id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Navy hero banner ─────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Decorative ring */}
        <View style={styles.heroBg} />
        <BackBtn onPress={() => navigation.goBack()} dark />

        <View style={styles.heroRow}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitial}>
              {display.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroCity}>{display.city}</Text>
            <Text style={styles.heroName} numberOfLines={2}>
              {display.name}
            </Text>
            {/* Rating strip */}
            <View style={styles.heroMeta}>
              <StarIcon filled />
              <Text style={styles.heroRating}>
                {typeof display.averageRating === 'number'
                  ? display.averageRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.heroReviews}>
                ({display.totalReviews ?? reviews.length} reviews)
              </Text>
              <View style={[styles.badge, isAccepting ? styles.badgeGreen : styles.badgeGrey]}>
                <Text style={[styles.badgeText, isAccepting ? styles.badgeTextGreen : styles.badgeTextGrey]}>
                  {isAccepting ? '✓ Open' : 'Paused'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={Colors.navy} size="large" /></View>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Sub>{display.description}</Sub>
              </View>
            ) : null}

            {profile?.categories && profile.categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services offered</Text>
                <View style={styles.chipRow}>
                  {profile.categories.map(cat => (
                    <View key={cat} style={styles.chip}>
                      <Text style={styles.chipText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Client reviews ({display.totalReviews ?? reviews.length})
              </Text>
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
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky CTA bar ──────────────────────────────────────── */}
      <View style={styles.ctaBar}>
        {isAccepting ? (
          <Btn
            onPress={() => navigation.navigate('BookAgency', { agency: display })}
            style={{
              shadowColor: Colors.navy,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            Book this agency →
          </Btn>
        ) : (
          <Btn variant="ghost">Not accepting bookings right now</Btn>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },

  // Hero
  hero: {
    backgroundColor: Colors.navy,
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 4,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', right: -36, top: -36,
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: Colors.goldTint,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatar: {
    width: SCREEN_WIDTH < 360 ? 52 : 64,
    height: SCREEN_WIDTH < 360 ? 52 : 64,
    borderRadius: 14,
    backgroundColor: Colors.goldTint,
    borderWidth: 1.5,
    borderColor: Colors.goldTintBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroInitial: {
    fontFamily: Fonts.interBold,
    fontSize: SCREEN_WIDTH < 360 ? 22 : 26,
    color: Colors.goldLight,
  },
  heroInfo: { flex: 1 },
  heroCity: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 9.5,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: Colors.gold, marginBottom: 3,
  },
  heroName: {
    fontFamily: Fonts.interBold,
    fontSize: SCREEN_WIDTH < 360 ? 17 : 20,
    color: Colors.paper, lineHeight: 26,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, flexWrap: 'wrap' },
  heroRating: { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.goldLight },
  heroReviews: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.paperFaint },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  badgeGreen: { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: Colors.successBorder },
  badgeGrey:  { backgroundColor: Colors.paperSubtle, borderWidth: 1, borderColor: Colors.paperDivider },
  badgeText: { fontFamily: Fonts.interSemiBold, fontSize: 10 },
  badgeTextGreen: { color: Colors.verifiedGreen },  badgeTextGrey:  { color: Colors.paperDim },

  // Scroll content
  scroll: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20, paddingBottom: 20 },

  // Sections
  section: { marginBottom: 22 },
  sectionTitle: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 10,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: Colors.slateSoft, marginBottom: 12,
  },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    backgroundColor: Colors.navyPale, paddingHorizontal: 13,
    paddingVertical: 7, borderRadius: 100,
    borderWidth: 1, borderColor: Colors.line,
  },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },

  // Reviews
  reviewCard: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 14,
    padding: 14, marginBottom: 10, backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.goldLight },
  reviewName: { fontFamily: Fonts.interBold, fontSize: 13, color: Colors.navy },
  reviewDate: { fontFamily: Fonts.inter, fontSize: 10.5, color: Colors.slateSoft, marginTop: 1 },
  reviewComment: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20 },

  // Loading / error
  loadingBox: { paddingVertical: 50, alignItems: 'center' },
  errorBox:   { paddingVertical: 24, alignItems: 'center', gap: 12 },
  errorText:  { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.navyPale },
  retryText:  { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },

  // Sticky CTA
  ctaBar: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 8,
  },
});
