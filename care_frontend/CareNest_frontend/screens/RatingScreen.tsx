import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitReview } from '../services/api';

const STARS = [1, 2, 3, 4, 5];

export default function RatingScreen({ route, navigation }: any) {
  const bookingId: string | undefined = route.params?.bookingId;
  const agencyName: string | undefined = route.params?.agencyName;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking information.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Rating required', 'Tap a number to rate your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const userDataRaw = await AsyncStorage.getItem('userData');
      if (!userDataRaw) {
        Alert.alert('Error', 'You need to be logged in to submit a review.');
        return;
      }
      const userData = JSON.parse(userDataRaw);

      await submitReview(userData.id, { bookingId, rating, comment: comment.trim() });
      setSubmitted(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Thanks for your feedback!</Text>
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

      <View style={styles.centered}>
        <Text style={styles.title}>Rate your experience</Text>
        {!!agencyName && <Text style={styles.subtitle}>with {agencyName}</Text>}

        <View style={styles.starsRow}>
          {STARS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.starButton, value <= rating && styles.starButtonActive]}
              onPress={() => setRating(value)}>
              <Text style={[styles.starButtonText, value <= rating && styles.starButtonTextActive]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Comments (optional)</Text>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="How did it go?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Submit Review</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  header:              { paddingHorizontal: 20, paddingTop: 20 },
  backText:            { color: '#0D1B2A', fontSize: 15, fontWeight: '600' },
  centered:            { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:               { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  subtitle:            { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 4 },
  starsRow:            { flexDirection: 'row', justifyContent: 'center', marginTop: 30, gap: 10 },
  starButton:          { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  starButtonActive:    { backgroundColor: '#0D1B2A', borderColor: '#0D1B2A' },
  starButtonText:      { color: '#666666', fontWeight: '700', fontSize: 16 },
  starButtonTextActive:{ color: '#fff' },
  label:               { color: '#0D1B2A', fontSize: 13, marginTop: 30, marginBottom: 8, alignSelf: 'flex-start' },
  input:               { width: '100%', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, fontSize: 15, height: 100, textAlignVertical: 'top' },
  button:              { width: '100%', backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled:      { opacity: 0.5 },
  buttonText:          { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});