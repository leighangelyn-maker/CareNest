import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedAgencies, getAgencies, getUnreadNotificationCount } from '../services/api';

const SERVICES = [
  { label: 'Nanny', category: 'Nanny' },
  { label: 'Cleaning', category: 'Cleaning' },
  { label: 'Cooking', category: 'Cooking' },
];

export default function HomeScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [saved, setSaved] = useState<any[]>([]);
  const [topAgencies, setTopAgencies] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const userDataRaw = await AsyncStorage.getItem('userData');
      if (userDataRaw) {
        setFirstName(JSON.parse(userDataRaw).firstName || '');
      }
      const [savedList, agencyList] = await Promise.all([
        getSavedAgencies().catch(() => []),
        getAgencies().catch(() => []),
      ]);
      setSaved(savedList.data ?? savedList ?? []);
      setTopAgencies((agencyList.data ?? agencyList ?? []).slice(0, 5));

      getUnreadNotificationCount()
        .then((res) => setUnreadCount(res.data ?? res ?? 0))
        .catch(() => {});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#0D1B2A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#0D1B2A"
          />
        }>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Care Nest</Text>
            <Text style={styles.subGreeting}>
              {firstName ? `Welcome back, ${firstName}` : 'Trusted care, just a tap away'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellButton}>
            <Text style={styles.bellIcon}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchCard}
          onPress={() => navigation.navigate('AgencySearch')}>
          <Text style={styles.searchText}>Search agencies by service, city, rating…</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>What do you need?</Text>
        <View style={styles.servicesRow}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.category}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('AgencySearch', { category: service.category })}>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {saved.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Saved Agencies</Text>
            {saved.map((item: any) => (
              <TouchableOpacity
                key={item.agencyId}
                style={styles.agencyRow}
                onPress={() => navigation.navigate('AgencyProfile', { agencyId: item.agencyId })}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoPlaceholder]}>
                    <Text style={styles.logoInitial}>{item.agencyName?.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.agencyInfo}>
                  <Text style={styles.agencyName}>{item.agencyName}</Text>
                  <Text style={styles.agencyRating}>{item.averageRating?.toFixed(1)} rating</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Top Agencies Near You</Text>
        {topAgencies.length === 0 ? (
          <Text style={styles.emptyText}>No agencies found yet.</Text>
        ) : (
          topAgencies.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.agencyRow}
              onPress={() => navigation.navigate('AgencyProfile', { agencyId: item.id })}>
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder]}>
                  <Text style={styles.logoInitial}>{item.name?.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.agencyInfo}>
                <Text style={styles.agencyName}>{item.name}</Text>
                <Text style={styles.agencyRating}>
                  {item.averageRating?.toFixed(1)} · {item.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:          { padding: 20, paddingBottom: 40 },
  headerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:        { fontSize: 26, fontWeight: 'bold', color: '#0D1B2A' },
  subGreeting:     { fontSize: 13, color: '#666666', marginTop: 4 },
  bellButton:      { position: 'relative', paddingTop: 4 },
  bellIcon:        { color: '#0D1B2A', fontSize: 13, fontWeight: '600' },
  badge:           { position: 'absolute', top: -6, right: -10, backgroundColor: '#B71C1C', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:       { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  searchCard:      { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, marginBottom: 24 },
  searchText:      { color: '#666666', fontSize: 14 },
  sectionTitle:    { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginTop: 8, marginBottom: 12 },
  servicesRow:     { flexDirection: 'row', gap: 12, marginBottom: 8 },
  serviceCard:     { flex: 1, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, alignItems: 'center' },
  serviceLabel:    { color: '#0D1B2A', fontSize: 13, fontWeight: '600' },
  emptyText:       { color: '#999', fontSize: 13 },
  agencyRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  logo:            { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  logoPlaceholder: { backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center' },
  logoInitial:     { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  agencyInfo:      { flex: 1 },
  agencyName:      { color: '#1A1A1A', fontSize: 15, fontWeight: '600' },
  agencyRating:    { color: '#666666', fontSize: 13, marginTop: 2 },
});