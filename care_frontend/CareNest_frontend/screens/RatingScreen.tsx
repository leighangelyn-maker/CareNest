import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, Alert
} from 'react-native';

export default function RatingScreen({ navigation, route }: any) {
  const { booking } = route.params;
  const [rating, setRating]   = useState(0);
  const [review, setReview]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '✅ Thank you!',
        'Your rating has been submitted successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.scroll}>
        <Text style={styles.title}>Rate this Service</Text>

        {/* Booking summary */}
        <View style={styles.card}>
          <Text style={styles.serviceText}>
            {booking.service === 'Nanny' ? '👶' : booking.service === 'Cleaner' ? '🧹' : '👨‍🍳'}
            {'  '}{booking.service}
          </Text>
          <Text style={styles.detail}>🏢 {booking.agency}</Text>
          {booking.worker && <Text style={styles.detail}>👷 {booking.worker}</Text>}
          <Text style={styles.detail}>📅 {booking.date}</Text>
        </View>

        {/* Star rating */}
        <Text style={styles.label}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, star <= rating && styles.starActive]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Tap to rate' :
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' : 'Excellent!'}
        </Text>

        {/* Review */}
        <Text style={styles.label}>Write a review (optional)</Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="Share your experience..."
          placeholderTextColor="#888"
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:      { padding: 16 },
  backText:     { color: '#00BCD4', fontSize: 16 },
  scroll:       { padding: 24 },
  title:        { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  card:         { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 24 },
  serviceText:  { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detail:       { color: '#aaa', fontSize: 14, marginBottom: 4 },
  label:        { color: '#00BCD4', fontSize: 14, marginBottom: 12 },
  starsRow:     { flexDirection: 'row', gap: 12, marginBottom: 8 },
  star:         { fontSize: 48, color: '#2E4060' },
  starActive:   { color: '#FFD700' },
  ratingText:   { color: '#888', fontSize: 14, marginBottom: 24 },
  reviewInput:  { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 15, height: 120, textAlignVertical: 'top' },
  button:       { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});