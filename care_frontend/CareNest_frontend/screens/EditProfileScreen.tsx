import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { getFamilyProfile, updateFamilyProfile } from '../services/api';

export default function EditProfileScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [householdNotes, setHouseholdNotes] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await getFamilyProfile();
        const profile = response.data ?? response;
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
        setHouseholdNotes(profile.householdNotes ?? '');
        setEmergencyContactName(profile.emergencyContactName ?? '');
        setEmergencyContactPhone(profile.emergencyContactPhone ?? '');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing info', 'First and last name are required.');
      return;
    }

    setSaving(true);
    try {
      await updateFamilyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        householdNotes: householdNotes.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#0D1B2A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
          placeholderTextColor="#999" />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
          placeholderTextColor="#999" />

        <Text style={styles.label}>Household Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={householdNotes}
          onChangeText={setHouseholdNotes}
          placeholder="Allergies, routines, gate codes, anything a worker should know"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Emergency Contact Name</Text>
        <TextInput style={styles.input} value={emergencyContactName} onChangeText={setEmergencyContactName}
          placeholderTextColor="#999" />

        <Text style={styles.label}>Emergency Contact Phone</Text>
        <TextInput style={styles.input} value={emergencyContactPhone} onChangeText={setEmergencyContactPhone}
          keyboardType="phone-pad" placeholderTextColor="#999" />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backText:       { color: '#0D1B2A', fontSize: 15, fontWeight: '600' },
  scroll:         { padding: 20, paddingTop: 10, paddingBottom: 60 },
  title:          { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  label:          { color: '#0D1B2A', fontSize: 13, marginTop: 16, marginBottom: 6 },
  input:          { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, fontSize: 15 },
  multiline:      { height: 90, textAlignVertical: 'top' },
  button:         { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});