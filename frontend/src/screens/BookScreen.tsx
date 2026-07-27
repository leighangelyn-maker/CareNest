import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { createBooking } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Eyebrow,
  Field,
  ScreenTitle,
  Sub,
  inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAgency'>;

const DURATION_OPTIONS = [2, 4, 6, 8] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Auto-format helpers ─────────────────────────────────────────────────────

/** Format date as YYYY-MM-DD auto-inserting dashes */
function formatDateInput(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** Format time as HH:MM auto-inserting colon */
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function toIso(date: string, time: string): string {
  try {
    return new Date(`${date}T${time}:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function addHours(isoString: string, hours: number): string {
  try {
    const d = new Date(isoString);
    d.setTime(d.getTime() + hours * 3600 * 1000);
    return d.toISOString();
  } catch {
    return isoString;
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateDate(d: string): string | null {
  if (!d) return 'Date is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return 'Date must be YYYY-MM-DD.';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'Invalid date.';
  if (date < new Date(new Date().setHours(0, 0, 0, 0))) return 'Date cannot be in the past.';
  return null;
}

function validateTime(t: string): string | null {
  if (!t) return 'Start time is required.';
  if (!/^\d{2}:\d{2}$/.test(t)) return 'Time must be HH:MM (24-hour).';
  const [h, m] = t.split(':').map(Number);
  if (h > 23 || m > 59) return 'Invalid time.';
  return null;
}

export default function BookScreen({ navigation, route }: Props) {
  const { agency } = route.params;

  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!category.trim()) e.category = 'Please enter the service you need.';
    const dateErr = validateDate(date);
    if (dateErr) e.date = dateErr;
    const timeErr = validateTime(startTime);
    if (timeErr) e.time = timeErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      const startIso = toIso(date.trim(), startTime.trim());
      const endIso = addHours(startIso, duration);

      const booking = await createBooking({
        agencyId: agency.id,
        categoryId: 1,
        startTime: startIso,
        endTime: endIso,
        isRecurring: false,
        familyNotes: category.trim() + (notes.trim() ? ` — ${notes.trim()}` : ''),
      });

      navigation.navigate('Pay', { booking, agency });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to create booking.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Step 1 of 3 · Request</Eyebrow>
        <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>Book {agency.name}</ScreenTitle>
        <Sub>Fill in the details below and we'll match you with an available worker.</Sub>

        {/* Service needed */}
        <Field label="Service needed *">
          <TextInput
            style={[inputStyle, errors.category && styles.inputError]}
            value={category}
            onChangeText={(v) => { setCategory(v); setErrors(p => ({ ...p, category: '' })); }}
            placeholder="e.g. Nanny, Cleaner, Caregiver"
            placeholderTextColor={Colors.slateSoft}
            autoCapitalize="words"
          />
          {errors.category ? <Text style={styles.fieldError}>{errors.category}</Text> : null}
        </Field>

        {/* Date with auto-dash */}
        <Field label="Date *  (YYYY-MM-DD)">
          <TextInput
            style={[inputStyle, errors.date && styles.inputError]}
            value={date}
            onChangeText={(v) => {
              setDate(formatDateInput(v));
              setErrors(p => ({ ...p, date: '' }));
            }}
            placeholder="2026-07-25"
            placeholderTextColor={Colors.slateSoft}
            keyboardType="number-pad"
            maxLength={10}
          />
          {errors.date ? <Text style={styles.fieldError}>{errors.date}</Text> : null}
        </Field>

        {/* Time with auto-colon */}
        <Field label="Start time *  (HH:MM — 24hr)">
          <TextInput
            style={[inputStyle, errors.time && styles.inputError]}
            value={startTime}
            onChangeText={(v) => {
              setStartTime(formatTimeInput(v));
              setErrors(p => ({ ...p, time: '' }));
            }}
            placeholder="08:00"
            placeholderTextColor={Colors.slateSoft}
            keyboardType="number-pad"
            maxLength={5}
          />
          {errors.time ? <Text style={styles.fieldError}>{errors.time}</Text> : null}
        </Field>

        {/* Duration */}
        <Field label="Duration (hours)">
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setDuration(h)}
                style={[styles.durationBtn, duration === h && styles.durationBtnActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.durationBtnText, duration === h && styles.durationBtnTextActive]}>
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Notes */}
        <Field label="Additional notes (optional)">
          <TextInput
            style={[inputStyle, { height: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special requirements…"
            placeholderTextColor={Colors.slateSoft}
            multiline
            textAlignVertical="top"
          />
        </Field>

        {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

        {loading ? (
          <View style={styles.loadingBtn}>
            <ActivityIndicator color={Colors.goldLight} />
          </View>
        ) : (
          <Btn onPress={handleContinue}>Continue to payment →</Btn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 40,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  fieldError: {
    fontFamily: Fonts.inter,
    fontSize: 11.5,
    color: Colors.danger,
    marginTop: 4,
  },
  generalError: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  durationBtnActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  durationBtnText: {
    fontFamily: Fonts.interBold,
    fontSize: 13,
    color: Colors.navy,
  },
  durationBtnTextActive: {
    color: Colors.goldLight,
  },
  loadingBtn: {
    width: '100%',
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    opacity: 0.8,
  },
});
