import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAgencyById, getReviewsByAgency,
  getSavedAgencies, saveAgency, unsaveAgency
} from '../services/api';

export default function AgencyProfileScreen({ route, navigation }: any) {
  const { agencyId } = route.params;
  const [agency, setAgency] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingSave, setTogglingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [agencyRes, reviewsRes, savedRes] = await Promise.all([
          getAgencyById(agencyId),
          getReviewsByAgency(agencyId).catch(() => ({ data: [] })),
          getSavedAgencies().catch(() => ({ data: [] })),
        ]);

        setAgency(agencyRes.data ?? agencyRes);
        setReviews(reviewsRes.data ?? reviewsRes ?? []);

        const savedList = savedRes.data ?? savedRes ?? [];
        setIsSaved(savedList.some((a: any) => a.agencyId === agencyId));
      } catch (err: any) {
        setError(err.message || 'Could not load this agency.');
      } finally {
        setLoading(false);
      }
    })();
  }, [agencyId]);

  const toggleSave = async () => {
    setTogglingSave(true);
    try {
      if (isSaved) {
        await unsaveAgency(agencyId);
        setIsSaved(false);
      } else {
        await saveAgency(agencyId);
        setIsSaved(true);
      }
    } catch {
      // Non-fatal
    } finally {
      setTogglingSave(false);
    }
  };

  const handleCall = () => {
    if (agency?.phone) Linking.openURL(`tel:${agency.phone}`);
  };

  const handleBookNow = async () => {
  const userDataRaw = await AsyncStorage.getItem('userData');
  if (!userDataRaw) return;
  navigation.navigate('Booking', {
    screen: 'BookingMain',
    params: { agencyId, agencyName: agency?.name },
  });
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#0D1B2A" />
      </SafeAreaView>
    );
  }

  if (error || !agency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? 'Agency not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          {agency.logoUrl ? (
            <Image source={{ uri: agency.logoUrl }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Text style={styles.logoInitial}>{agency.name?.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{agency.name}</Text>
            <Text style={styles.rating}>
              {agency.averageRating?.toFixed(1)} · {agency.totalReviews} reviews
            </Text>
            <Text style={[styles.badge, agency.acceptingBookings ? styles.badgeOpen : styles.badgeClosed]}>
              {agency.acceptingBookings ? 'Accepting bookings' : 'Not accepting bookings'}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleSave} disabled={togglingSave}>
            <Text style={[styles.saveText, isSaved && styles.saveTextActive]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {!!agency.description && <Text style={styles.description}>{agency.description}</Text>}

        {!!agency.phone && (
          <TouchableOpacity style={styles.callRow} onPress={handleCall}>
            <Text style={styles.callText}>{agency.phone} — Tap to call</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Care Team ({agency.workers?.length ?? 0})</Text>
        {(!agency.workers || agency.workers.length === 0) ? (
          <Text style={styles.empty}>No staff listed yet.</Text>
        ) : (
          agency.workers.map((worker: any) => (
            <View key={worker.id} style={styles.workerRow}>
              {worker.photoUrl ? (
                <Image source={{ uri: worker.photoUrl }} style={styles.workerPhoto} />
              ) : (
                <View style={[styles.workerPhoto, styles.logoPlaceholder]}>
                  <Text style={styles.workerInitial}>{worker.firstName?.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.firstName} {worker.lastName}</Text>
                <Text style={styles.workerMeta}>
                  {worker.yearsExperience} yrs exp · {worker.averageRating?.toFixed(1)}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.empty}>No reviews yet.</Text>
        ) : (
          reviews.map((review: any) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                <Text style={styles.reviewStars}>{review.rating}/5</Text>
              </View>
              {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.bookButton, !agency.acceptingBookings && styles.bookButtonDisabled]}
          onPress={handleBookNow}
          disabled={!agency.acceptingBookings}>
          <Text style={styles.bookButtonText}>
            {agency.acceptingBookings ? 'Book This Agency' : 'Not Accepting Bookings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error:              { color: '#0D1B2A' },
  header:             { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backText:           { color: '#0D1B2A', fontSize: 15, fontWeight: '600' },
  scroll:             { padding: 20, paddingTop: 0, paddingBottom: 60 },
  headerCard:         { flexDirection: 'row', alignItems: 'flex-start' },
  logo:               { width: 64, height: 64, borderRadius: 32 },
  logoPlaceholder:    { backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center' },
  logoInitial:        { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  headerInfo:         { flex: 1, marginLeft: 14 },
  name:               { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  rating:             { fontSize: 13, color: '#666666', marginTop: 4 },
  badge:              { fontSize: 12, fontWeight: '600', marginTop: 6 },
  badgeOpen:          { color: '#2E7D32' },
  badgeClosed:        { color: '#0D1B2A' },
  saveText:           { fontSize: 13, color: '#666666', fontWeight: '600', padding: 6 },
  saveTextActive:     { color: '#0D1B2A' },
  description:        { fontSize: 14, color: '#666666', lineHeight: 20, marginTop: 18 },
  callRow:            { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, marginTop: 16 },
  callText:           { color: '#0D1B2A', fontSize: 14, fontWeight: '600' },
  sectionTitle:       { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginTop: 26, marginBottom: 10 },
  empty:              { color: '#999', fontSize: 13 },
  workerRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  workerPhoto:        { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  workerInitial:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  workerInfo:         { flex: 1 },
  workerName:         { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  workerMeta:         { fontSize: 12, color: '#666666', marginTop: 2 },
  reviewCard:         { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 10 },
  reviewHeader:       { flexDirection: 'row', justifyContent: 'space-between' },
  reviewerName:       { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  reviewStars:        { fontSize: 12, color: '#0D1B2A', fontWeight: '600' },
  reviewComment:      { fontSize: 13, color: '#666666', marginTop: 4, lineHeight: 18 },
  bookButton:         { backgroundColor: '#0D1B2A', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  bookButtonDisabled: { backgroundColor: '#CCCCCC' },
  bookButtonText:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});