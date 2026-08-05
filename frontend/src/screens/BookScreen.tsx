import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, ApiServiceCategory, ApiFamilyAddress } from '../types';
import { createBooking, getServiceCategories, getFamilyAddresses } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Field,
  ProgressBar,
  ScreenTitle,
  Sub,
  inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAgency'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_DURATION = 1;
const MAX_DURATION = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIso(date: Date, time: Date): string {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

function addHours(isoString: string, hours: number): string {
  const d = new Date(isoString);
  d.setTime(d.getTime() + hours * 3_600_000);
  return d.toISOString();
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDisplayTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookScreen({ navigation, route }: Props) {
  const { agency } = route.params;

  // Dates & time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const t = new Date();
    t.setMinutes(0, 0, 0);
    return t;
  });

  const [dateTriggerPressed, setDateTriggerPressed] = useState(false);
  const [timeTriggerPressed, setTimeTriggerPressed] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Duration
  const [duration, setDuration] = useState<number>(4);
  const [durationText, setDurationText] = useState<string>('4');
  const durationInputRef = useRef<TextInput>(null);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Service category
  const [categories, setCategories] = useState<ApiServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Family address
  const [addresses, setAddresses] = useState<ApiFamilyAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Load categories ──────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const cats = await getServiceCategories();
        setCategories(cats);
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // ─── Load addresses — refetches every time this screen gains focus, so
  // returning from AddAddressScreen shows the new address immediately ──────

  const loadAddresses = useCallback(async () => {
    try {
      const addrs = await getFamilyAddresses();
      setAddresses(addrs);
      const def = addrs.find(a => a.default) ?? addrs[0];
      if (def) setSelectedAddressId(prev => prev ?? def.id);
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  // ─── Date picker handlers ────────────────────────────────────────────────

  function onDateChange(_: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setErrors(p => ({ ...p, date: '' }));
    }
  }

  function onTimeChange(_: DateTimePickerEvent, time?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
      setErrors(p => ({ ...p, time: '' }));
    }
  }

  // ─── Duration stepper ────────────────────────────────────────────────────

  function applyDuration(val: number) {
    const clamped = Math.max(MIN_DURATION, Math.min(MAX_DURATION, val));
    setDuration(clamped);
    setDurationText(String(clamped));
  }

  function handleDurationTextChange(text: string) {
    const cleaned = text.replace(/\D/g, '');
    setDurationText(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setDuration(Math.max(MIN_DURATION, Math.min(MAX_DURATION, parsed)));
    }
  }

  function handleDurationBlur() {
    const parsed = parseInt(durationText, 10);
    if (isNaN(parsed) || parsed < MIN_DURATION) {
      applyDuration(MIN_DURATION);
    } else {
      applyDuration(parsed);
    }
    Keyboard.dismiss();
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedCategoryId) e.category = 'Please select a service.';
    if (!selectedAddressId) e.address = 'Please select an address.';

    const now = new Date();
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    if (startDateTime < now) e.time = 'Start date/time cannot be in the past.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleContinue() {
    Keyboard.dismiss();
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      const startIso = toIso(selectedDate, selectedTime);
      const endIso = addHours(startIso, duration);

      const booking = await createBooking({
        agencyId: agency.id,
        serviceCategoryId: selectedCategoryId!,
        familyAddressId: selectedAddressId!,
        startTime: startIso,
        endTime: endIso,
        isRecurring: false,
        familyNotes: notes.trim() || undefined,
      });

      navigation.navigate('Confirm', { booking, agency });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to create booking.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackBtn onPress={() => navigation.goBack()} />
            <ProgressBar current={1} total={2} />
            <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>
              Book {agency.name}
            </ScreenTitle>
            <Sub>Fill in the details below and we'll match you with an available worker.</Sub>

            {/* ── Service needed ────────────────────────────────────────── */}
            <Field label="Service needed *">
              {categoriesLoading ? (
                <ActivityIndicator size="small" color={Colors.navy} />
              ) : categories.length === 0 ? (
                <Text style={styles.emptyHint}>No service categories available right now.</Text>
              ) : (
                <View style={styles.chipWrap}>
                  {categories.map((cat) => {
                    const selected = cat.id === selectedCategoryId;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setErrors(p => ({ ...p, category: '' }));
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {errors.category ? (
                <Text style={styles.fieldError}>{errors.category}</Text>
              ) : null}
            </Field>

            {/* ── Address ───────────────────────────────────────────────── */}
            <Field label="Service address *">
              {addressesLoading ? (
                <ActivityIndicator size="small" color={Colors.navy} />
              ) : addresses.length === 0 ? (
                <View>
                  <Text style={styles.emptyHint}>
                    No saved address found.
                  </Text>
                  <TouchableOpacity
                    style={styles.addAddressBtn}
                    onPress={() => navigation.navigate('AddAddress')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.addAddressBtnText}>+ Add an address</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {addresses.map((addr) => {
                    const selected = addr.id === selectedAddressId;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[styles.addressCard, selected && styles.addressCardSelected]}
                        onPress={() => {
                          setSelectedAddressId(addr.id);
                          setErrors(p => ({ ...p, address: '' }));
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.addressLabel, selected && styles.addressLabelSelected]}>
                          {addr.label || 'Address'}{addr.default ? '  ·  Default' : ''}
                        </Text>
                        <Text style={styles.addressLine}>
                          {addr.line1}{addr.city ? `, ${addr.city}` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addAddressBtnSecondary}
                    onPress={() => navigation.navigate('AddAddress')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.addAddressBtnSecondaryText}>+ Add another address</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors.address ? (
                <Text style={styles.fieldError}>{errors.address}</Text>
              ) : null}
            </Field>

            {/* ── Date picker ───────────────────────────────────────────── */}
            <Field label="Date *">
              <TouchableOpacity
                style={[
                  styles.pickerTrigger,
                  errors.date && styles.inputError,
                  dateTriggerPressed && styles.pickerTriggerPressed,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowTimePicker(false);
                  setShowDatePicker(v => !v);
                }}
                onPressIn={() => setDateTriggerPressed(true)}
                onPressOut={() => setDateTriggerPressed(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.pickerTriggerText}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <Text style={styles.pickerIcon}>📅</Text>
              </TouchableOpacity>
              {errors.date ? (
                <Text style={styles.fieldError}>{errors.date}</Text>
              ) : null}

              {showDatePicker && (
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                    minimumDate={today}
                    onChange={onDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.pickerDoneBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Field>

            {/* ── Time picker ───────────────────────────────────────────── */}
            <Field label="Start time *">
              <TouchableOpacity
                style={[
                  styles.pickerTrigger,
                  errors.time && styles.inputError,
                  timeTriggerPressed && styles.pickerTriggerPressed,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(false);
                  setShowTimePicker(v => !v);
                }}
                onPressIn={() => setTimeTriggerPressed(true)}
                onPressOut={() => setTimeTriggerPressed(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.pickerTriggerText}>
                  {formatDisplayTime(selectedTime)}
                </Text>
                <Text style={styles.pickerIcon}>🕐</Text>
              </TouchableOpacity>
              {errors.time ? (
                <Text style={styles.fieldError}>{errors.time}</Text>
              ) : null}

              {showTimePicker && (
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                    is24Hour={false}
                    onChange={onTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.pickerDoneBtn}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Field>

            {/* ── Duration stepper ──────────────────────────────────────── */}
            <Field label={`Duration (hours)  ·  min ${MIN_DURATION} · max ${MAX_DURATION}`}>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    duration <= MIN_DURATION && styles.stepperBtnDisabled,
                  ]}
                  onPress={() => applyDuration(duration - 1)}
                  disabled={duration <= MIN_DURATION}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease duration"
                  accessibilityRole="button"
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>

                <TextInput
                  ref={durationInputRef}
                  style={styles.stepperInput}
                  value={durationText}
                  onChangeText={handleDurationTextChange}
                  onBlur={handleDurationBlur}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={handleDurationBlur}
                />

                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    duration >= MAX_DURATION && styles.stepperBtnDisabled,
                  ]}
                  onPress={() => applyDuration(duration + 1)}
                  disabled={duration >= MAX_DURATION}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase duration"
                  accessibilityRole="button"
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>

                <Text style={styles.stepperLabel}>hr{duration !== 1 ? 's' : ''}</Text>
              </View>
            </Field>

            {/* ── Notes ────────────────────────────────────────────────── */}
            <Field label="Additional notes (optional)">
              <TextInput
                style={[inputStyle, { height: 100 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requirements…"
                placeholderTextColor={Colors.slateSoft}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                maxLength={300}
              />
              <Text style={styles.charCount}>{notes.length}/300</Text>
            </Field>

            {errors.general ? (
              <Text style={styles.generalError}>{errors.general}</Text>
            ) : null}

            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={Colors.goldLight} />
              </View>
            ) : (
              <Btn onPress={handleContinue}>Send booking request →</Btn>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 48,
  },

  inputError: { borderColor: Colors.danger, borderWidth: 1.5 },
  fieldError: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.danger, marginTop: 4 },
  generalError: {
    fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger,
    marginBottom: 12, textAlign: 'center',
  },
  emptyHint: {
    fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 18,
  },

  // ── Add address prompts ──────────────────────────────────────────────────
  addAddressBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: Colors.navy,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addAddressBtnText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 13,
    color: Colors.navy,
  },
  addAddressBtnSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addAddressBtnSecondaryText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12.5,
    color: Colors.slate,
  },

  // ── Category chips ───────────────────────────────────────────────────────
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.navyPale,
  },
  chipSelected: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  chipText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12.5,
    color: Colors.navy,
  },
  chipTextSelected: {
    color: Colors.goldLight,
  },

  // ── Address cards ────────────────────────────────────────────────────────
  addressCard: {
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: Colors.paper,
  },
  addressCardSelected: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navyPale,
  },
  addressLabel: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12.5,
    color: Colors.slate,
    marginBottom: 2,
  },
  addressLabelSelected: {
    color: Colors.navy,
  },
  addressLine: {
    fontFamily: Fonts.inter,
    fontSize: 12.5,
    color: Colors.slate,
  },

  // ── Picker trigger ────────────────────────────────────────────────────────
  pickerTrigger: {
    ...inputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerPressed: {
    borderColor: Colors.navy,
    borderWidth: 1.5,
    backgroundColor: Colors.navyPale,
  },
  pickerTriggerText: { fontFamily: Fonts.inter, fontSize: 13.5, color: Colors.ink },
  pickerIcon: { fontSize: 16 },

  pickerWrapper: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.navyPale,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  pickerDoneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  pickerDoneText: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.navy },

  // ── Duration stepper ─────────────────────────────────────────────────────
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnDisabled: { backgroundColor: Colors.line },
  stepperBtnText: { fontFamily: Fonts.interBold, fontSize: 20, color: Colors.goldLight, lineHeight: 24 },
  stepperInput: {
    width: 60, height: 42, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.navy,
    backgroundColor: Colors.paper, textAlign: 'center',
    fontFamily: Fonts.interBold, fontSize: 17, color: Colors.navy,
  },
  stepperLabel: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.slate, marginLeft: 2 },

  loadingBtn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', opacity: 0.8,
  },
  charCount: {
    fontFamily: Fonts.inter, fontSize: 11, color: Colors.slateSoft,
    textAlign: 'right', marginTop: 4,
  },
});