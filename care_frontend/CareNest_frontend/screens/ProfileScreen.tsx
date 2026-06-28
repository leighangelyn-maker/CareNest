import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView
} from 'react-native';

export default function ProfileScreen({ navigation }: any) {
  const user = {
    name: 'Ama Mensah',
    email: 'ama@email.com',
    phone: '+233 24 000 0000',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>👤 My Profile</Text>

        <View style={styles.avatarBox}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>Client</Text>
        </View>

        <View style={styles.card}>
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={user.phone} />
          <Row label="Role"  value="Client" />
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2E4060' },
  label: { color: '#888', fontSize: 14 },
  value: { color: '#fff', fontSize: 14 },
});

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0A1F44' },
  scroll:      { padding: 24, paddingBottom: 48 },
  title:       { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  avatarBox:   { alignItems: 'center', marginBottom: 24 },
  avatar:      { fontSize: 64, marginBottom: 12 },
  name:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  role:        { color: '#00BCD4', fontSize: 14, marginTop: 4 },
  card:        { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 24 },
  editBtn:     { backgroundColor: '#1C2E4A', borderWidth: 1, borderColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  editBtnText: { color: '#00BCD4', fontWeight: 'bold', fontSize: 16 },
  logoutBtn:   { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center' },
  logoutText:  { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});