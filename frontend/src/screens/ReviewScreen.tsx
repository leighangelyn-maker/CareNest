import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBookings } from '../BookingContext';
import { submitReview } from '../api/reviews';
import { BackBtn, Btn, Field, ScreenTitle, Sub, inputStyle } from '../components/atoms';
import { Colors, Fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const { markReviewed } = useBookings();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (stars === 0) { setError('Please select a rating'); return; }
    setError(null);
    setLoading(true);
    try {
      await submitReview(bookingId, stars, comment);
      markReviewed(bookingId);
      navigation.navigate('MainTabs');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: Colors.paper }}
      keyboardShouldPersistTaps="handled"
    >
      <BackBtn onPress={() => navigation.goBack()} />
      <View style={{ alignItems: 'center' }}>
        <ScreenTitle>Leave a Review</ScreenTitle>
        <Sub>Your review helps other families choose with confidence.</Sub>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((v) => (
            <TouchableOpacity key={v} onPress={() => setStars(v)} activeOpacity={0.7}>
              <Svg width={34} height={34} viewBox="0 0 24 24">
                <Path
                  d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z"
                  fill={v <= stars ? Colors.gold : Colors.line}
                />
              </Svg>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Field label="Comments (optional)">
        <TextInput
          style={[inputStyle, { height: 100 }]}
          multiline
          textAlignVertical="top"
          placeholder="Share your experience…"
          placeholderTextColor={Colors.slateSoft}
          value={comment}
          onChangeText={setComment}
          editable={!loading}
        />
      </Field>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.navy} style={{ marginTop: 8 }} />
      ) : (
        <Btn onPress={handleSubmit}>Submit review</Btn>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, paddingTop: 26, paddingBottom: 32, backgroundColor: Colors.paper },
  stars: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 14 },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, marginBottom: 10, textAlign: 'center' },
});
