import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Dimensions, NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  { key: 'welcome', icon: '🏠', title: 'Welcome to\nCare Nest', body: 'Your trusted platform for finding professional home care services in Ghana.' },
  { key: 'nanny', icon: '👶', title: 'Nanny\nServices', body: 'Find trusted and verified nannies to care for your children at home with love.' },
  { key: 'cook', icon: '👨‍🍳', title: 'Cook\nServices', body: 'Get a skilled home cook to prepare delicious and healthy meals for your family.' },
  { key: 'cleaner', icon: '🧹', title: 'Cleaner\nServices', body: 'Book professional cleaners to keep your home spotless, fresh and beautiful.' },
  { key: 'final', icon: '🎉', title: 'Enjoy Your\nBooking!', body: 'Sign in or create an account to start booking trusted care services today.' },
];

export default function OnboardingScreen({ navigation }: any) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const handleNext = () => {
    if (!isLastSlide) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isLastSlide && (
        <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Login')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconRing}>
              <Text style={styles.iconEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      {isLastSlide ? (
        <View style={styles.finalButtonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('Register')}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Login')}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.singleButton} onPress={handleNext}>
          <Text style={styles.buttonText}>Next  →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FFFFFF' },
  skip:            { alignSelf: 'flex-end', padding: 20, zIndex: 1 },
  skipText:        { color: '#666666', fontSize: 14, fontWeight: '600' },
  slide:           { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconRing:        { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconEmoji:       { fontSize: 56 },
  title:           { fontSize: 28, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginBottom: 14, lineHeight: 34 },
  body:            { fontSize: 15, color: '#666666', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  dotsRow:         { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  dotActive:       { backgroundColor: '#0D1B2A', width: 22 },
  button:          { flex: 1, backgroundColor: '#0D1B2A', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  singleButton:    { backgroundColor: '#0D1B2A', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginHorizontal: 24, marginBottom: 30, marginTop: 20 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  finalButtonRow:  { flexDirection: 'row', gap: 12, marginHorizontal: 24, marginBottom: 30, marginTop: 20 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#0D1B2A', fontSize: 15, fontWeight: 'bold' },
});