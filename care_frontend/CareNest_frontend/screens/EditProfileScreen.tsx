import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';

export default function EditProfileScreen({ navigation }: any) {
  const [name, setName]   = useState('Ama Mensah');
  const [email, setEmail] = useState('ama@email.com');
  const [phone, setPhone] = useState('+233 24 000 0000');

  const handleSave = () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('✅ Success', 'Profile updated successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.avatarBox}>
          <Text style={styles.avatar}>👤</Text>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input}
          placeholderTextColor="#888"
          value={name} onChangeText={setName} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input}
          placeholderTextColor="#888"
          value={email} onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input}
          placeholderTextColor="#888"
          value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:         { padding: 16 },
  backText:        { color: '#00BCD4', fontSize: 16 },
  scroll:          { padding: 24, paddingBottom: 48 },
  title:           { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  avatarBox:       { alignItems: 'center', marginBottom: 24 },
  avatar:          { fontSize: 80, marginBottom: 12 },
  changePhotoBtn:  { backgroundColor: '#1C2E4A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  changePhotoText: { color: '#00BCD4', fontSize: 14 },
  label:           { color: '#00BCD4', fontSize: 14, marginBottom: 8 },
  input:           { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  button:          { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});