import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, FlatList, Image, ActivityIndicator
} from 'react-native';
import { getAgencies } from '../services/api';

const CATEGORIES = ['All', 'Nanny', 'Cleaning', 'Cooking'];
const RATING_FILTERS = [
  { label: 'Any rating', value: undefined as number | undefined },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

export default function AgencySearchScreen({ route, navigation }: any) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<string>(route.params?.category ?? 'All');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAgencies({
        category: category === 'All' ? undefined : category,
        city: city.trim() || undefined,
        minRating,
      });
      setResults(response.data ?? response ?? []);
    } catch (err: any) {
      setError(err.message || 'Search failed. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, minRating]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={city}
          onChangeText={setCity}
          placeholder="Search by city…"
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, category === item && styles.chipActive]}
            onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        horizontal
        data={RATING_FILTERS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, minRating === item.value && styles.chipActive]}
            onPress={() => setMinRating(item.value)}>
            <Text style={[styles.chipText, minRating === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#C62828" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : results.length === 0 ? (
        <Text style={styles.empty}>No agencies match those filters.</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AgencyProfile', { agencyId: item.id })}>
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder]}>
                  <Text style={styles.logoInitial}>{item.name?.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.city}</Text>
                <Text style={styles.cardRating}>
                  {item.averageRating?.toFixed(1)} ({item.totalReviews} reviews)
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20 },
  searchBar:        { flexDirection: 'row', gap: 8 },
  searchInput:      { flex: 1, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  searchButton:     { backgroundColor: '#0D1B2A', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: 'bold' },
  chipRow:          { marginTop: 14, flexGrow: 0 },
  chip:             { borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive:       { backgroundColor: '#0D1B2A' },
  chipText:         { fontSize: 13, color: '#0D1B2A' },
  chipTextActive:   { color: '#fff', fontWeight: '600' },
  loader:           { marginTop: 30 },
  error:            { color: '#0D1B2A', marginTop: 20, fontSize: 13 },
  empty:            { color: '#999', marginTop: 30, textAlign: 'center' },
  listContent:      { paddingTop: 16, paddingBottom: 40 },
  card:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  logo:             { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  logoPlaceholder:  { backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center' },
  logoInitial:      { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  cardInfo:         { flex: 1 },
  cardName:         { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  cardMeta:         { fontSize: 13, color: '#666666', marginTop: 2 },
  cardRating:       { fontSize: 13, color: '#666666', marginTop: 2 },
});