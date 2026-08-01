import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { addFamilyAddress } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Field,
  ScreenTitle,
  Sub,
  inputStyle,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAddress'>;

export default function AddAddressScreen({ navigation }: Props) {
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!label.trim()) e.label = 'Please give this address a label.';
    if (!line1.trim()) e.line1 = 'Street address is required.';
    if (!city.trim()) e.city = 'City is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      await addFamilyAddress({
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        region: region.trim(),
        latitude: 0,
        longitude: 0,
        default: isDefault,
      });
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to save address.';
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
            <ScreenTitle>Add address</ScreenTitle>
            <Sub>This is where a worker will provide care. You can add more addresses later.</Sub>

            <Field label="Label *">
              <TextInput
                style={[inputStyle, errors.label && styles.inputError]}
                value={label}
                onChangeText={(v) => { setLabel(v); setErrors(p => ({ ...p, label: '' })); }}
                placeholder="e.g. Home, Office"
                placeholderTextColor={Colors.slateSoft}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.label ? <Text style={styles.fieldError}>{errors.label}</Text> : null}
            </Field>

            <Field label="Street address *">
              <TextInput
                style={[inputStyle, errors.line1 && styles.inputError]}
                value={line1}
                onChangeText={(v) => { setLine1(v); setErrors(p => ({ ...p, line1: '' })); }}
                placeholder="e.g. 12 Ring Road"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="next"
              />
              {errors.line1 ? <Text style={styles.fieldError}>{errors.line1}</Text> : null}
            </Field>

            <Field label="Apartment, suite, etc. (optional)">
              <TextInput
                style={inputStyle}
                value={line2}
                onChangeText={setLine2}
                placeholder="e.g. Unit 4B"
                placeholderTextColor={Colors.slateSoft}
                returnKeyType="next"
              />
            </Field>

            <Field label="City *">
              <TextInput
                style={[inputStyle, errors.city && styles.inputError]}
                value={city}
                onChangeText={(v) => { setCity(v); setErrors(p => ({ ...p, city: '' })); }}
                placeholder="e.g. Accra"
                placeholderTextColor={Colors.slateSoft}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.city ? <Text style={styles.fieldError}>{errors.city}</Text> : null}
            </Field>

            <Field label="Region (optional)">
              <TextInput
                style={inputStyle}
                value={region}
                onChangeText={setRegion}
                placeholder="e.g. Greater Accra"
                placeholderTextColor={Colors.slateSoft}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </Field>

            <View style={styles.defaultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.defaultLabel}>Set as default address</Text>
                <Text style={styles.defaultSub}>Used automatically for new bookings</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: Colors.line, true: Colors.navy }}
                thumbColor={isDefault ? Colors.goldLight : Colors.slateSoft}
                ios_backgroundColor={Colors.line}
              />
            </View>

            {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

            {saving ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={Colors.goldLight} />
              </View>
            ) : (
              <Btn onPress={handleSave}>Save address</Btn>
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
  defaultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, marginBottom: 8,
    borderTopWidth: 1, borderTopColor: Colors.line,
  },
  defaultLabel: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.ink },
  defaultSub: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slateSoft, marginTop: 2 },
  loadingBtn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', opacity: 0.8,
  },
});