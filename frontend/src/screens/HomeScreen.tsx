import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, TextInput,
  Modal, Animated, TouchableWithoutFeedback,
  Switch, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList, AgencySummary } from '../types';
import { CATS } from '../data';
import { searchAgencies } from '../api/agencies';
import { useAuth } from '../AuthContext';
import { Avatar, Eyebrow, ScreenTitle, StarIcon } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING, TAB_BAR_HEIGHT } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

// ─── Filter state ─────────────────────────────────────────────────────────────
const LOCATIONS = ['All areas', 'Accra', 'Kumasi', 'Tamale', 'Tema', 'Cape Coast', 'Takoradi'];
const AVAILABILITY = ['Any', 'Weekdays', 'Weekends', 'Mornings', 'Evenings', 'Full-time'];
const LANGUAGES = ['English', 'Twi', 'Ga', 'Hausa', 'Ewe', 'French'];
const GENDERS = ['Any', 'Female', 'Male'];
const EXPERIENCE_OPTIONS = ['Any', '1+ years', '3+ years', '5+ years', '10+ years'];
const MIN_RATING_OPTIONS = [0, 3, 3.5, 4, 4.5];

interface Filters {
  category: string;
  location: string;
  availability: string;
  minPrice: string;
  maxPrice: string;
  minRating: number;
  experience: string;
  verifiedOnly: boolean;
  gender: string;
  languages: string[];
}

const DEFAULT_FILTERS: Filters = {
  category: 'All',
  location: 'All areas',
  availability: 'Any',
  minPrice: '',
  maxPrice: '',
  minRating: 0,
  experience: 'Any',
  verifiedOnly: false,
  gender: 'Any',
  languages: [],
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.slateSoft} strokeWidth="2" strokeLinecap="round">
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? Colors.goldLight : Colors.navy} strokeWidth="2" strokeLinecap="round">
      <Line x1="4" y1="6" x2="20" y2="6" />
      <Line x1="7" y1="12" x2="17" y2="12" />
      <Line x1="10" y1="18" x2="14" y2="18" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="2" strokeLinecap="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

// ─── Pill selector (single-select) ───────────────────────────────────────────
function PillSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 2 }}>
      {options.map(o => (
        <TouchableOpacity
          key={o}
          onPress={() => onChange(o)}
          style={[filterStyles.pill, value === o && filterStyles.pillActive]}
          activeOpacity={0.75}
        >
          <Text style={[filterStyles.pillText, value === o && filterStyles.pillTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Multi-select pills ───────────────────────────────────────────────────────
function MultiPillSelect({ options, values, onChange }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(o: string) {
    onChange(values.includes(o) ? values.filter(v => v !== o) : [...values, o]);
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 2 }}>
      {options.map(o => {
        const active = values.includes(o);
        return (
          <TouchableOpacity key={o} onPress={() => toggle(o)} style={[filterStyles.pill, active && filterStyles.pillActive]} activeOpacity={0.75}>
            <Text style={[filterStyles.pillText, active && filterStyles.pillTextActive]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const filterStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1.5,
    borderColor: Colors.line, backgroundColor: Colors.paper,
  },
  pillActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  pillText: { fontFamily: Fonts.interSemiBold, fontSize: 12.5, color: Colors.navy },
  pillTextActive: { color: Colors.goldLight },
});

// ─── Filter section header ────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={panelStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Filter Panel Modal ───────────────────────────────────────────────────────
function FilterPanel({ visible, filters, onApply, onClose }: {
  visible: boolean;
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  function set<K extends keyof Filters>(key: K) {
    return (val: Filters[K]) => setDraft(d => ({ ...d, [key]: val }));
  }

  function countActive(f: Filters): number {
    let n = 0;
    if (f.category !== 'All') n++;
    if (f.location !== 'All areas') n++;
    if (f.availability !== 'Any') n++;
    if (f.minPrice || f.maxPrice) n++;
    if (f.minRating > 0) n++;
    if (f.experience !== 'Any') n++;
    if (f.verifiedOnly) n++;
    if (f.gender !== 'Any') n++;
    if (f.languages.length > 0) n++;
    return n;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={panelStyles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[panelStyles.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={panelStyles.handle} />

        {/* Header */}
        <View style={panelStyles.header}>
          <Text style={panelStyles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
            contentContainerStyle={panelStyles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

          <FilterSection title="Service category">
            <PillSelect options={CATS} value={draft.category} onChange={set('category')} />
          </FilterSection>

          <FilterSection title="Location">
            <PillSelect options={LOCATIONS} value={draft.location} onChange={set('location')} />
          </FilterSection>

          <FilterSection title="Availability">
            <PillSelect options={AVAILABILITY} value={draft.availability} onChange={set('availability')} />
          </FilterSection>

          <FilterSection title="Price range (₵/hr)">
            <View style={panelStyles.priceRow}>
              <TextInput
                style={panelStyles.priceInput}
                value={draft.minPrice}
                onChangeText={set('minPrice')}
                placeholder="Min"
                placeholderTextColor={Colors.slateSoft}
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="next"
              />
              <Text style={panelStyles.priceSep}>—</Text>
              <TextInput
                style={panelStyles.priceInput}
                value={draft.maxPrice}
                onChangeText={set('maxPrice')}
                placeholder="Max"
                placeholderTextColor={Colors.slateSoft}
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="done"
              />
            </View>
          </FilterSection>

          <FilterSection title="Minimum rating">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MIN_RATING_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => set('minRating')(r)}
                  style={[panelStyles.ratingBtn, draft.minRating === r && panelStyles.ratingBtnActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[panelStyles.ratingBtnText, draft.minRating === r && panelStyles.ratingBtnTextActive]}>
                    {r === 0 ? 'Any' : `★ ${r}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Experience">
            <PillSelect options={EXPERIENCE_OPTIONS} value={draft.experience} onChange={set('experience')} />
          </FilterSection>

          <FilterSection title="Languages spoken">
            <MultiPillSelect options={LANGUAGES} values={draft.languages} onChange={set('languages')} />
          </FilterSection>

          <FilterSection title="Gender preference">
            <PillSelect options={GENDERS} value={draft.gender} onChange={set('gender')} />
          </FilterSection>

          <FilterSection title="Verification">
            <View style={panelStyles.switchRow}>
              <Text style={panelStyles.switchLabel}>Verified workers only</Text>
              <Switch
                value={draft.verifiedOnly}
                onValueChange={set('verifiedOnly')}
                trackColor={{ false: Colors.line, true: Colors.navy }}
                thumbColor={draft.verifiedOnly ? Colors.goldLight : Colors.slateSoft}
                ios_backgroundColor={Colors.line}
              />
            </View>
          </FilterSection>

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Footer */}
        <View style={panelStyles.footer}>
          <TouchableOpacity
            onPress={() => setDraft(DEFAULT_FILTERS)}
            style={panelStyles.resetBtn}
            activeOpacity={0.75}
          >
            <Text style={panelStyles.resetText}>Reset all</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onApply(draft); onClose(); }}
            style={panelStyles.applyBtn}
            activeOpacity={0.85}
          >
            <Text style={panelStyles.applyText}>
              Apply{countActive(draft) > 0 ? ` (${countActive(draft)})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const panelStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.navyOverlayLight,
  },
  panel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.line, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  headerTitle: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.navy },
  scroll: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20 },
  sectionTitle: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.1,
    textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 10,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: {
    flex: 1, backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink,
  },
  priceSep: { fontFamily: Fonts.interBold, fontSize: 16, color: Colors.slate },
  ratingBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.paper,
  },
  ratingBtnActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  ratingBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  ratingBtnTextActive: { color: Colors.goldLight },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  switchLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.line,
    backgroundColor: Colors.paper,
  },
  resetBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.line,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  resetText: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.slate },
  applyBtn: {
    flex: 2, backgroundColor: Colors.navy,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  applyText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
});

// ─── Location helper ──────────────────────────────────────────────────────────
async function getLocationLabel(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return `${data.city ?? data.region ?? 'Ghana'} · Now`;
  } catch {
    return 'Ghana · Now';
  }
}

// ─── Active filter badge count ────────────────────────────────────────────────
function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.category !== 'All') n++;
  if (f.location !== 'All areas') n++;
  if (f.availability !== 'Any') n++;
  if (f.minPrice || f.maxPrice) n++;
  if (f.minRating > 0) n++;
  if (f.experience !== 'Any') n++;
  if (f.verifiedOnly) n++;
  if (f.gender !== 'Any') n++;
  if (f.languages.length > 0) n++;
  return n;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState('Ghana · Now');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  // Card entrance animation
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => { getLocationLabel().then(setLocationLabel); }, []);

  const loadAgencies = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    listOpacity.setValue(0);
    try {
      const data = await searchAgencies(category);
      setAgencies(data);
      Animated.timing(listOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) loadAgencies(); }, [loadAgencies, token]);

  // Derived: search + filter on client side
  const filteredAgencies = agencies.filter(a => {
    const q = searchQuery.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.city.toLowerCase().includes(q)) return false;
    if (filters.location !== 'All areas' && !a.city.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.minRating > 0 && (a.averageRating ?? 0) < filters.minRating) return false;
    return true;
  });

  function handleApplyFilters(f: Filters) {
    setFilters(f);
    setSearchQuery('');
    loadAgencies(f.category === 'All' ? undefined : f.category);
  }

  const filterCount = activeFilterCount(filters);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Eyebrow>{locationLabel}</Eyebrow>
          <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 23}>Find trusted help</ScreenTitle>
        </View>
      </View>

      {/* ── Search bar + filter button ─────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search agencies or location…"
            placeholderTextColor={Colors.slateSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
          accessibilityLabel="Open filters"
          accessibilityRole="button"
        >
          <FilterIcon active={filterCount > 0} />
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Category chips ─────────────────────────────────────────── */}
      <View style={styles.chipBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => handleApplyFilters({ ...filters, category: c })}
              style={[styles.chip, filters.category === c && styles.chipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, filters.category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAgencies()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Results count ──────────────────────────────────────────── */}
      {!loading && !error && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsLabel}>
            {filteredAgencies.length > 0
              ? `${filteredAgencies.length} agenc${filteredAgencies.length === 1 ? 'y' : 'ies'} found`
              : 'No agencies found'}
          </Text>
          {filterCount > 0 && (
            <TouchableOpacity onPress={() => handleApplyFilters(DEFAULT_FILTERS)}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── List ───────────────────────────────────────────────────── */}
      {loading ? (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : filteredAgencies.length === 0 && !error ? (
        <View style={styles.centred}>
          <View style={styles.emptyIcon}>
            <View style={{ transform: [{ scale: 1.3 }] }}>
              <SearchIcon />
            </View>
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No agencies in this category yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {searchQuery ? 'Try a different search term or clear filters.' : 'Try a different category or check back soon.'}
          </Text>
          <TouchableOpacity
            onPress={() => { setSearchQuery(''); handleApplyFilters(DEFAULT_FILTERS); }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Clear search & filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: listOpacity }}>
          <FlatList
            data={filteredAgencies}
            keyExtractor={(a) => a.id}
            contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: a, index }) => (
              <AgencyCard agency={a} index={index} onPress={() => navigation.navigate('AgencyProfile', { agency: a })} />
            )}
          />
        </Animated.View>
      )}

      {/* ── Filter panel ───────────────────────────────────────────── */}
      <FilterPanel
        visible={showFilters}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[skeletonStyles.card, { opacity: pulse }]}>
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.body}>
        <View style={skeletonStyles.line} />
        <View style={[skeletonStyles.line, { width: '55%', marginTop: 7 }]} />
        <View style={[skeletonStyles.line, { width: '35%', marginTop: 7, height: 10 }]} />
      </View>
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.navyPale, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: Colors.line,
  },
  avatar: { width: 46, height: 46, borderRadius: 12, backgroundColor: Colors.line },
  body: { flex: 1, gap: 0 },
  line: { height: 13, borderRadius: 6, backgroundColor: Colors.line, width: '80%' },
});
function AgencyCard({ agency: a, index, onPress }: {
  agency: AgencySummary; index: number; onPress: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  function onPressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }
  function onPressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Avatar name={a.name} size={46} />
        <View style={styles.cardBody}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{a.name}</Text>
            {a.averageRating >= 4.5 && (
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>✓ Verified</Text>
              </View>
            )}
          </View>
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
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.slateSoft} strokeWidth="2" strokeLinecap="round">
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  header: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 8,
    paddingBottom: 10,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
    paddingBottom: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyPale,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Colors.ink,
    padding: 0,
  },
  filterBtn: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: Colors.navyPale,
    borderWidth: 1.5, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  filterBadge: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.paper,
  },
  filterBadgeText: {
    fontFamily: Fonts.interBold, fontSize: 10, color: Colors.paper,
  },

  // Chips
  chipBar: {
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.line, backgroundColor: Colors.paper,
  },
  chipRow: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingVertical: 7, gap: 6, alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 100, backgroundColor: Colors.navyPale,
  },
  chipActive: { backgroundColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },

  // Results row
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingTop: 8, paddingBottom: 2,
  },
  resultsLabel: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 10,
    letterSpacing: 1.1, textTransform: 'uppercase', color: Colors.slateSoft,
  },
  clearFiltersText: {
    fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy,
    textDecorationLine: 'underline',
  },

  // Error
  errorBanner: {
    marginHorizontal: SCREEN_H_PADDING, marginVertical: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: Colors.dangerBg, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dangerBorder,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.danger, flex: 1 },
  retryBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 7, backgroundColor: Colors.danger,
  },
  retryBtnText: { fontFamily: Fonts.interBold, fontSize: 11, color: Colors.paper },

  // List
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  list: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 6, gap: 10 },

  // Agency card
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1, borderColor: Colors.line,
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 2,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy },
  verifiedPill: {
    backgroundColor: Colors.successBg,
    borderWidth: 1, borderColor: Colors.successBorder,
    borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedPillText: {
    fontFamily: Fonts.interSemiBold, fontSize: 9.5, color: Colors.success,
  },
  cardCity: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slate, marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: Fonts.interBold, fontSize: 11.5, color: Colors.navy },
  reviewCount: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slate },

  // Empty state
  emptyIcon: {
    width: 52, height: 52, backgroundColor: Colors.navyPale,
    borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Fonts.interBold, fontSize: 14, color: Colors.navy,
    marginBottom: 4, textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate,
    lineHeight: 20, textAlign: 'center', marginBottom: 14,
  },
  clearBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.navy,
  },
  clearBtnText: { fontFamily: Fonts.interBold, fontSize: 13, color: Colors.navy },
});
