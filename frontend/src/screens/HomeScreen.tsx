import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList, AgencySummary } from '../types';
import { CATS } from '../data';
import { searchAgencies } from '../api/agencies';
import { useAuth } from '../AuthContext';
import { Avatar, Eyebrow, ScreenTitle, SearchIcon, StarIcon } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const GHANA_TOWNS = ['Accra', 'Kumasi', 'Tamale', 'Tema', 'Cape Coast', 'Takoradi', 'Sunyani', 'Koforidua'];

async function getLocationLabel(): Promise<string> {
  try {
    // Use IP geolocation — no permissions needed
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const city = data.city ?? data.region ?? 'Ghana';
    return `${city} · Now`;
  } catch {
    return 'Ghana · Now';
  }
}

export default function HomeScreen({ navigation }: Props) {
  const [cat, setCat] = useState('All');
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState('Ghana · Now');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  useEffect(() => {
    getLocationLabel().then(setLocationLabel);
  }, []);

  const loadAgencies = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchAgencies(category);
      setAgencies(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadAgencies();
  }, [loadAgencies, token]);

  function handleCatPress(c: string) {
    setCat(c);
    loadAgencies(c === 'All' ? undefined : c);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Static header */}
      <View style={styles.header}>
        <Eyebrow>{locationLabel}</Eyebrow>
        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 23}>Find trusted help</ScreenTitle>
      </View>

      {/* Static chip bar — always visible */}
      <View style={styles.chipBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATS.map((c) => (
            <TouchableOpacity key={c} onPress={() => handleCatPress(c)}
              style={[styles.chip, cat === c && styles.chipActive]}>
              <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAgencies(cat === 'All' ? undefined : cat)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Count */}
      {!loading && !error && (
        <Text style={styles.resultsLabel}>
          {agencies.length > 0
            ? `${agencies.length} agenc${agencies.length === 1 ? 'y' : 'ies'} near you`
            : '0 agencies near you'}
        </Text>
      )}

      {loading ? (
        <View style={styles.centred}><ActivityIndicator size="large" color={Colors.navy} /></View>
      ) : agencies.length === 0 && !error ? (
        <View style={styles.centred}>
          <View style={styles.emptyIcon}><SearchIcon /></View>
          <Text style={styles.emptyTitle}>No agencies in this category yet</Text>
          <Text style={styles.emptyBody}>Try a different category or check back soon.</Text>
          {cat !== 'All' && (
            <TouchableOpacity onPress={() => handleCatPress('All')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={(a) => a.id}
          contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: a }) => (
            <TouchableOpacity style={styles.card}
              onPress={() => navigation.navigate('AgencyProfile', { agency: a })} activeOpacity={0.8}>
              <Avatar name={a.name} size={44} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{a.name}</Text>
                <Text style={styles.cardCity}>{a.city}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.ratingRow}>
                    <StarIcon filled />
                    <Text style={styles.ratingText}>
                      {typeof a.averageRating === 'number' ? a.averageRating.toFixed(1) : '—'}
                    </Text>
                  </View>
                  <Text style={styles.reviewCount}>{a.totalReviews ?? 0} reviews</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 8, paddingBottom: 4 },
  chipBar: {
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.line, backgroundColor: Colors.paper,
  },
  chipRow: { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 7, gap: 6, alignItems: 'center' },
  chip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 100, backgroundColor: Colors.navyPale },
  chipActive: { backgroundColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },
  errorBanner: {
    marginHorizontal: SCREEN_H_PADDING, marginVertical: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: 'rgba(201,53,53,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(201,53,53,0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { fontFamily: Fonts.inter, fontSize: 12, color: '#c13535', flex: 1 },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: '#c13535' },
  retryBtnText: { fontFamily: Fonts.interBold, fontSize: 11, color: '#fff' },
  resultsLabel: {
    paddingHorizontal: SCREEN_H_PADDING, paddingTop: 6, paddingBottom: 2,
    fontFamily: Fonts.spaceMonoBold, fontSize: 10,
    letterSpacing: 1.1, textTransform: 'uppercase', color: Colors.slateSoft,
  },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  list: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 4, gap: 8 },
  card: {
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10,
    elevation: 1, shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy },
  cardCity: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slate, marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: Fonts.interBold, fontSize: 11.5, color: Colors.navy },
  reviewCount: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slate },
  emptyIcon: {
    width: 50, height: 50, backgroundColor: Colors.navyPale,
    borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontFamily: Fonts.interBold, fontSize: 13.5, color: Colors.navy, marginBottom: 4, textAlign: 'center' },
  emptyBody: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 20, textAlign: 'center' },
  clearBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.navy },
  clearBtnText: { fontFamily: Fonts.interBold, fontSize: 12.5, color: Colors.navy },
});
