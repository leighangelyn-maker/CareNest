 import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ScrollView
} from 'react-native';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', 'Account created!');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏠 Care Nest</Text>
        <Text style={styles.subtitle}>Create an account</Text>

        <TextInput style={styles.input} placeholder="Full Name"
          placeholderTextColor="#888" value={name} onChangeText={setName} />

        <TextInput style={styles.input} placeholder="Email"
          placeholderTextColor="#888" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Phone Number"
          placeholderTextColor="#888" value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" />

        <TextInput style={styles.input} placeholder="Password"
          placeholderTextColor="#888" value={password}
          onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F44' },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#00BCD4', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#1C2E4A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#00BCD4', textAlign: 'center', fontSize: 14 },
});
