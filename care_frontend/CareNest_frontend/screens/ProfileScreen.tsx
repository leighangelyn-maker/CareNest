 import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView
} from 'react-native';

export default function ProfileScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>E</Text>
          </View>
          <Text style={styles.name}>Elizabeth</Text>
          <Text style={styles.email}>elizabeth@carenest.com</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>📋 My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>⚙️ Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>❓ Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F44' },
  scroll: { padding: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00BCD4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#aaa', fontSize: 14 },
  card: { backgroundColor: '#1C2E4A', borderRadius: 12, padding: 8, marginBottom: 24 },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#0A1F44' },
  menuText: { color: '#fff', fontSize: 16 },
  logoutBtn: { borderColor: '#ff4444', borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  logoutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
});
