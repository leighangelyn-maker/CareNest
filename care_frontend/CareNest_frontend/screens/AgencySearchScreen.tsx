import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, FlatList
} from 'react-native';

type Agency = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  services: string[];
  location: string;
  phone: string;
  verified: boolean;
};

const dummyAgencies: Agency[] = [
  {
    id: '1',
    name: 'Angelyn Home Services',
    rating: 4.8,
    reviews: 120,
    services: ['Nanny', 'Cleaner', 'Cook'],
    location: 'kumasi, '
    ,
    phone: '+233 539504082',
    verified: true,
  },
];

export default function AgencySearchScreen({ navigation, route }: any) {
  const { service } = route.params;
  const [search, setSearch] = useState('');

  const filtered = dummyAgencies.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Agencies for {service}</Text>
        <Text style={styles.subtitle}>{filtered.length} agency available</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search agencies..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('AgencyProfile', {
              agency: item,
              service,
            })}>
            <View style={styles.cardTop}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.agencyName}>{item.name}</Text>
                  {item.verified && (
                    <Text style={styles.verified}>✓ Verified</Text>
                  )}
                </View>
                <Text style={styles.stars}>
                  {renderStars(item.rating)}
                  <Text style={styles.ratingNum}> {item.rating} ({item.reviews} reviews)</Text>
                </Text>
                <Text style={styles.location}>📍 {item.location}</Text>
              </View>
            </View>

            <View style={styles.servicesRow}>
              {item.services.map((s) => (
                <View key={s} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.contactHint}>Tap to view profile & contact</Text>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:        { padding: 16 },
  backText:       { color: '#00BCD4', fontSize: 16 },
  header:         { paddingHorizontal: 24, marginBottom: 16 },
  title:          { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle:       { color: '#888', fontSize: 14, marginTop: 4 },
  searchBox:      { paddingHorizontal: 24, marginBottom: 16 },
  searchInput:    { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, fontSize: 16 },
  list:           { paddingHorizontal: 24, paddingBottom: 48 },
  card:           { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTop:        { flexDirection: 'row', marginBottom: 12 },
  avatarBox:      { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00BCD4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText:     { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  cardInfo:       { flex: 1 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  agencyName:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  verified:       { color: '#00BCD4', fontSize: 11, backgroundColor: '#0A1F44', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stars:          { color: '#FFD700', fontSize: 14, marginBottom: 4 },
  ratingNum:      { color: '#888', fontSize: 12 },
  location:       { color: '#888', fontSize: 13 },
  servicesRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  serviceTag:     { backgroundColor: '#0A1F44', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  serviceTagText: { color: '#00BCD4', fontSize: 12 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactHint:    { color: '#888', fontSize: 13 },
  arrow:          { color: '#00BCD4', fontSize: 18 },
});