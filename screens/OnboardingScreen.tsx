import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    icon: '🏠',
    title: 'Welcome to\nCare Nest',
    description: 'Your trusted platform for finding professional home care services in Ghana.',
    colors: ['#0A1F44', '#1C2E4A'],
    accent: '#00BCD4',
  },
  {
    id: 2,
    icon: '👶',
    title: 'Nanny\nServices',
    description: 'Find trusted and verified nannies to care for your children at home with love.',
    colors: ['#0A1F44', '#0D2137'],
    accent: '#00E5FF',
  },
  {
    id: 3,
    icon: '🧹',
    title: 'Cleaner\nServices',
    description: 'Book professional cleaners to keep your home spotless, fresh and beautiful.',
    colors: ['#0A1F44', '#112233'],
    accent: '#00BCD4',
  },
  {
    id: 4,
    icon: '👨‍🍳',
    title: 'Cook\nServices',
    description: 'Get a skilled home cook to prepare delicious and healthy meals for your family.',
    colors: ['#0A1F44', '#0D2137'],
    accent: '#00E5FF',
  },
  {
    id: 5,
    icon: '🎉',
    title: 'Enjoy Your\nBooking!',
    description: 'Sign in or create an account to start booking trusted care services today.',
    colors: ['#0A1F44', '#1C2E4A'],
    accent: '#00BCD4',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const slide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    <LinearGradient colors={slide.colors} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <View style={[styles.iconContainer, { borderColor: slide.accent }]}>
            <Text style={styles.icon}>{slide.icon}</Text>
          </View>

          <Text style={[styles.title, { color: slide.accent }]}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[
                styles.dot,
                i === currentIndex && [styles.activeDot, { backgroundColor: slide.accent }]
              ]} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: slide.accent }]}
            onPress={handleNext}>
            <Text style={styles.buttonText}>
              {isLast ? '🎉 Enjoy Your Booking!' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: { alignSelf: 'flex-end', padding: 16, marginTop: 8 },
  skipText: { color: '#888', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconContainer: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 40, backgroundColor: 'rgba(255,255,255,0.05)' },
  icon: { fontSize: 70 },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, lineHeight: 44 },
  description: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 26 },
  bottom: { padding: 32, alignItems: 'center' },
  dots: { flexDirection: 'row', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333', marginHorizontal: 5 },
  activeDot: { width: 28, borderRadius: 4 },
  button: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 48, alignItems: 'center', width: width - 64, shadowColor: '#00BCD4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});