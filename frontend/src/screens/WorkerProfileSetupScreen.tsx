import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Animated,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { BackBtn, Field, ScreenTitle, Sub, inputStyle, Btn } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerProfileSetup'>;

const SERVICE_TYPES = ['Nanny', 'Cook', 'Cleaner', 'Caregiver', 'Driver', 'Gardener', 'Tutor'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkerProfileSetupScreen({ navigation }: Props) {
  const [serviceType, setServiceType] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  // Load existing profile
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/workers/me');
        const wp = res.data;
        if (wp.serviceType)     setServiceType(wp.serviceType);
        if (wp.bio)             setBio(wp.bio);
        if (wp.experienceYears) setExperienceYears(String(wp.experienceYears));
        if (wp.hourlyRate)      setHourlyRate(String(wp.hourlyRate));
        if (wp.availableDays)   setSelectedDays(wp.availableDays.split(',').filter(Boolean));
      } catch {}
      setFetching(false);
    })();
  }, []);

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (!serviceType) {
      setError('Please select your service type.');
      triggerShake();
      return;
    }
    if (!hourlyRate || isNaN(Number(hourlyRate))) {
      setError('Enter a valid hourly rate.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.put('/workers/me/profile', {
        serviceType,
        bio,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        hourlyRate: parseFloat(hourlyRate),
        availableDays: selectedDays.join(','),
      });
      setSaved(true);
      setTimeout(() => navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      }), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to save profile. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackBtn onPress={() => navigation.goBack()} />
            <ScreenTitle>Worker Profile</ScreenTitle>
            <Sub style={{ marginBottom: 20 }}>
              This is what families see when searching for workers. Keep it up to date.
            </Sub>

            {/* Service type */}
            <Field label="Service type *">
              <View style={styles.chipRow}>
                {SERVICE_TYPES.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { setServiceType(s); setError(null); }}
                    style={[styles.chip, serviceType === s && styles.chipActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            {/* Bio */}
            <Field label="About yourself">
              <TextInput
                style={[inputStyle, { height: 90 }]}
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                placeholder="Describe your experience, strengths, and the type of households you work best with…"
                placeholderTextColor={Colors.slateSoft}
                blurOnSubmit
              />
            </Field>

            {/* Experience + Rate side by side */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="Years of experience">
                  <TextInput
                    style={inputStyle}
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                    keyboardType="number-pad"
                    placeholder="e.g. 3"
                    placeholderTextColor={Colors.slateSoft}
                    returnKeyType="next"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Hourly rate (₵) *">
                  <TextInput
                    style={inputStyle}
                    value={hourlyRate}
                    onChangeText={v => { setHourlyRate(v); setError(null); }}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 25"
                    placeholderTextColor={Colors.slateSoft}
                    returnKeyType="done"
                  />
                </Field>
              </View>
            </View>

            {/* Available days */}
            <Field label="Available days">
              <View style={styles.chipRow}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    style={[styles.chip, selectedDays.includes(d) && styles.chipActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, selectedDays.includes(d) && styles.chipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            {/* Error */}
            {error ? (
              <Animated.View
                style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Success */}
            {saved ? (
              <View style={styles.successBox}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="20 6 9 17 4 12" />
                </Svg>
                <Text style={styles.successText}>Profile saved! Redirecting…</Text>
              </View>
            ) : null}

            {/* Save button */}
            <Btn
              onPress={handleSave}
              style={loading || saved ? { opacity: 0.6 } : undefined}
            >
              {saved ? 'Saved ✓' : loading ? 'Saving…' : 'Save profile →'}
            </Btn>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 48,
  },
  twoCol: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    backgroundColor: Colors.navyPale,
    borderWidth: 1.5, borderColor: Colors.line,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },
  errorBox: {
    backgroundColor: Colors.dangerBg, borderWidth: 1,
    borderColor: Colors.dangerBorder, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, lineHeight: 19 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, borderWidth: 1,
    borderColor: Colors.successBorder, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  successText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.success },
});
