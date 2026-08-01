import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ApiServiceCategory } from '../types';
import { createWorker } from '../api/workers';
import { getServiceCategories } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Field,
  ScreenTitle,
  Sub,
  inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddWorker'>;

export default function AddWorkerScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rateInput, setRateInput] = useState('');

  const [categories, setCategories] = useState<ApiServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    if (!phoneNumber.trim()) e.phoneNumber = 'Phone number is required.';
    if (!email.trim()) e.email = 'Email is required.';
    if (!selectedCategoryId) e.category = 'Select the service this worker provides.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      if (!agencyId) {
        setErrors({ general: 'Could not determine your agency. Please log in again.' });
        return;
      }
      const rate = parseFloat(rateInput);
      await createWorker({
        agencyId,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        serviceCategoryId: selectedCategoryId!,
        defaultHourlyRateMinorUnits: !isNaN(rate) && rate > 0 ? Math.round(rate * 100) : 0,
      });
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to add worker.';
      setErrors({ general: msg });
    } finally {
      setSaving(false);
    }
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
            <ScreenTitle>Add worker</ScreenTitle>
            <Sub>Workers you add here can be assigned to incoming bookings.</Sub>

            <Field label="Full name *">
              <TextInput
                style={[inputStyle, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrors(p => ({ ...p, fullName: '' })); }}
                placeholder="e.g. Ama Mensah"
                placeholderTextColor={Colors.slateSoft}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
            </Field>

            <Field label="Phone number *">
              <TextInput
                style={[inputStyle, errors.phoneNumber && styles.inputError]}
                value={phoneNumber}
                onChangeText={(v) => { setPhoneNumber(v); setErrors(p => ({ ...p, phoneNumber: '' })); }}
                placeholder="e.g. 024 123 4567"
                placeholderTextColor={Colors.slateSoft}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
              {errors.phoneNumber ? <Text style={styles.fieldError}>{errors.phoneNumber}</Text> : null}
            </Field>

            <Field label="Email *">
              <TextInput
                style={[inputStyle, errors.email && styles.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
                placeholder="worker@example.com"
                placeholderTextColor={Colors.slateSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </Field>

            <Field label="Service *">
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
              {errors.category ? <Text style={styles.fieldError}>{errors.category}</Text> : null}
            </Field>

            <Field label="Default hourly rate (GHS, optional)">
              <TextInput
                style={inputStyle}
                value={rateInput}
                onChangeText={(v) => setRateInput(v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 20.00"
                placeholderTextColor={Colors.slateSoft}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </Field>

            {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

            {saving ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={Colors.goldLight} />
              </View>
            ) : (
              <Btn onPress={handleSave}>Add worker</Btn>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 16, paddingBottom: 48 },
  inputError: { borderColor: Colors.danger, borderWidth: 1.5 },
  fieldError: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.danger, marginTop: 4 },
  generalError: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, marginBottom: 12, textAlign: 'center' },
  emptyHint: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.navyPale,
  },
  chipSelected: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontFamily: Fonts.interSemiBold, fontSize: 12.5, color: Colors.navy },
  chipTextSelected: { color: Colors.goldLight },
  loadingBtn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', opacity: 0.8,
  },
});