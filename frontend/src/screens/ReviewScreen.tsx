import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBookings } from '../BookingContext';
import { submitReview } from '../api/reviews';
import { BackBtn, Btn, Field, ScreenTitle, Sub, inputStyle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated star ────────────────────────────────────────────────────────────
function Star({ filled, onPress, index }: { filled: boolean; onPress: () => void; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
    onPress();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`Rate ${index} star${index !== 1 ? 's' : ''}`}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={38} height={38} viewBox="0 0 24 24">
          <Path
            d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z"
            fill={filled ? Colors.gold : Colors.line}
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <View style={successStyles.container}>
        <Animated.View style={[successStyles.icon, { transform: [{ scale }] }]}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        </Animated.View>
        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Review submitted!</ScreenTitle>
        <Sub style={{ textAlign: 'center', marginTop: 8 }}>
          Thank you. Your feedback helps other families make the right choice.
        </Sub>
        <Btn
          onPress={onDone}
          style={{ marginTop: 28, backgroundColor: Colors.success }}
          textColor={Colors.paper}
        >
          Back to bookings
        </Btn>
      </View>
    </SafeAreaView>
  );
}

const successStyles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SCREEN_H_PADDING,
  },
  icon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.successBg, borderWidth: 2, borderColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReviewScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const { markReviewed, bookings } = useBookings();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const booking = bookings.find(b => b.id === bookingId);
  const isNotCompleted = booking && booking.status !== 'COMPLETED';

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleSubmit() {
    Keyboard.dismiss();
    if (stars === 0) {
      setError('Please select a star rating before submitting.');
      triggerShake();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await submitReview(bookingId, stars, comment);
      markReviewed(bookingId);
      setSubmitted(true);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg: string =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.response?.data?.data?.error ??
        e?.message ?? '';

      if (status === 403) {
        setError(
          'You are not allowed to review this booking. This can happen if:\n' +
          '• The booking has not been completed yet\n' +
          '• You have already submitted a review for this booking\n' +
          '• This booking does not belong to your account'
        );
      } else if (status === 422 || msg.toLowerCase().includes('already')) {
        setError('You have already submitted a review for this booking.');
      } else if (status === 404) {
        setError('Booking not found. It may have been deleted.');
      } else {
        setError(msg || 'Failed to submit review. Please try again.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SuccessView
        onDone={() => navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Bookings' } }],
        })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackBtn onPress={() => navigation.goBack()} />

            <View style={styles.heroSection}>
              <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Leave a Review</ScreenTitle>
              <Sub style={{ textAlign: 'center', marginTop: 6 }}>
                Your review helps other families choose with confidence.
              </Sub>

              {/* Warning if booking not completed */}
              {isNotCompleted ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ This booking is not marked as completed yet. The agency must mark it complete before you can submit a review.
                  </Text>
                </View>
              ) : null}

              {/* Stars */}
              <Animated.View
                style={[styles.stars, { transform: [{ translateX: shakeAnim }] }]}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <Star key={v} index={v} filled={v <= stars} onPress={() => setStars(v)} />
                ))}
              </Animated.View>

              {stars > 0 && (
                <Text style={styles.ratingLabel}>
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
                </Text>
              )}
            </View>

            <Field label="Comments (optional)">
              <TextInput
                style={[inputStyle, { height: 110 }]}
                multiline
                textAlignVertical="top"
                placeholder="Share your experience…"
                placeholderTextColor={Colors.slateSoft}
                value={comment}
                onChangeText={setComment}
                editable={!loading}
                returnKeyType="done"
                blurOnSubmit
              />
            </Field>

            {error ? (
              <Animated.View
                style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={Colors.paper} />
              </View>
            ) : (
              <Btn
                onPress={handleSubmit}
                style={{ backgroundColor: Colors.success }}
                textColor={Colors.paper}
              >
                Submit review
              </Btn>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  warningBox: {
    width: '100%',
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 20,
  },
  stars: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 4,
  },
  ratingLabel: {
    fontFamily: Fonts.interBold,
    fontSize: 14,
    color: Colors.gold,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 20,
  },
  loadingBtn: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    opacity: 0.7,
  },
});