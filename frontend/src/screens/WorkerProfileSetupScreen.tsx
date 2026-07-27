/**
 * WorkerProfileSetupScreen
 * Shown when a WORKER user logs in for the first time and needs to set up their profile.
 * Also accessible from the worker's Account tab to update profile details.
 */
import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { BackBtn, Eyebrow, Field, ScreenTitle, Sub, inputStyle } from '../components/atoms';
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

  // Load existing profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/workers/me');
        const wp = res.data;
        if (wp.serviceType) setServiceType(wp.serviceType);
        if (wp.bio) setBio(wp.bio);
        if (wp.experienceYears) setExperienceYears(String(wp.experienceYears));
        if (wp.hourlyRate) setHourlyRate(String(wp.hourlyRate));
        if (wp.availableDays) setSelectedDays(wp.availableDays.split(',').filter(Boolean));
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
    if (!serviceType) { setError('Select your service type.'); return; }
    if (!hourlyRate || isNaN(Number(hourlyRate))) { setError('Enter a valid hourly rate.'); return; }

    setLoading(true);
    setError(null);
    try {
      await apiClient.put('/workers/me/profile', {
        serviceType,
        bio,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        hourlyRate: parseFloat(hourlyRate),
        availableDays: selectedDays.join(','),
      });
      setSaved(true);
      setTimeout(() => navigation.replace('MainTabs'), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Worker profile</Eyebrow>
        <ScreenTitle>Set up your profile</ScreenTitle>
        <Sub>This is what families see when searching for workers. Keep it up to date.</Sub>

        <Field label="Service type">
          <View style={styles.chipRow}>
            {SERVICE_TYPES.map(s => (
              <TouchableOpacity key={s} onPress={() => setServiceType(s)}
                style={[styles.chip, serviceType === s && styles.chipActive]}>
                <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="About yourself">
          <TextInput style={[inputStyle, { height: 90 }]} value={bio} onChangeText={setBio}
            multiline textAlignVertical="top"
            placeholder="Describe your experience, strengths, and the type of households you work best with…"
            placeholderTextColor={Colors.slateSoft} />
        </Field>

        <Field label="Years of experience">
          <TextInput style={inputStyle} value={experienceYears} onChangeText={setExperienceYears}
            keyboardType="number-pad" placeholder="e.g. 3" placeholderTextColor={Colors.slateSoft} />
        </Field>

        <Field label="Hourly rate (GHS)">
          <TextInput style={inputStyle} value={hourlyRate} onChangeText={setHourlyRate}
            keyboardType="decimal-pad" placeholder="e.g. 25" placeholderTextColor={Colors.slateSoft} />
        </Field>

        <Field label="Available days">
          <View style={styles.chipRow}>
            {DAYS.map(d => (
              <TouchableOpacity key={d} onPress={() => toggleDay(d)}
                style={[styles.chip, selectedDays.includes(d) && styles.chipActive]}>
                <Text style={[styles.chipText, selectedDays.includes(d) && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {saved ? <Text style={styles.successText}>Profile saved! Redirecting…</Text> : null}

        <TouchableOpacity onPress={handleSave} disabled={loading || saved}
          style={[styles.btn, (loading || saved) && { opacity: 0.6 }]}>
          {loading
            ? <ActivityIndicator color={Colors.goldLight} />
            : <Text style={styles.btnText}>{saved ? 'Saved ✓' : 'Save profile →'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SCREEN_H_PADDING, paddingTop: 26, paddingBottom: 40 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: Colors.navyPale, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  chipTextActive: { color: Colors.goldLight },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, fontFamily: Fonts.inter },
  successText: { color: Colors.success, fontSize: 13, marginBottom: 12, fontFamily: Fonts.interSemiBold },
  btn: { width: '100%', backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
});
