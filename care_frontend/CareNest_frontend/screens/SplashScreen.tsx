import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');
      setTimeout(() => {
        if (token) {
          navigation.replace(role === 'AGENCY_ADMIN' ? 'AgencyHome' : 'Main');
        } else {
          navigation.replace('Onboarding');
        }
      }, 1800);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoOuterRing}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>C</Text>
        </View>
      </View>
      <Text style={styles.appName}>Care Nest</Text>
      <Text style={styles.tagline}>Trusted care, just a tap away</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoOuterRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center' },
  logoCircle:    { width: 90, height: 90, borderRadius: 45, backgroundColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center' },
  logoLetter:    { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  appName:       { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginTop: 24 },
  tagline:       { fontSize: 15, color: '#666666', fontStyle: 'italic', marginTop: 8 },
});