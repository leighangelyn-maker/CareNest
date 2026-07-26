import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFamilyProfile } from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userDataRaw = await AsyncStorage.getItem('userData');
        if (userDataRaw) {
          setEmail(JSON.parse(userDataRaw).email ?? '');
        }
        const response = await getFamilyProfile();
        setProfile(response.data ?? response);
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'userRole', 'userData']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#C62828" />
      </SafeAreaView>
    );
  }

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : email;
  const initial = (profile?.firstName ?? email ?? '?').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {!!email && <Text style={styles.email}>{email}</Text>}
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BookingHistory')}>
            <Text style={styles.menuText}>Booking History</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Home', { screen: 'AgencySearch' })}>
            <Text style={styles.menuText}>Find an Agency</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {!!profile?.householdNotes && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>HOUSEHOLD NOTES</Text>
            <Text style={styles.infoValue}>{profile.householdNotes}</Text>
          </View>
        )}

        {!!profile?.emergencyContactName && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>EMERGENCY CONTACT</Text>
            <Text style={styles.infoValue}>
              {profile.emergencyContactName}
              {profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:         { padding: 20, paddingTop: 50, paddingBottom: 60 },
  avatarWrap:     { alignItems: 'center', marginBottom: 30 },
  avatar:         { width: 84, height: 84, borderRadius: 42, backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center' },
  avatarInitial:  { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name:           { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 12 },
  email:          { fontSize: 13, color: '#666666', marginTop: 2 },
  menu:           { borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  menuItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  menuText:       { fontSize: 15, color: '#1A1A1A' },
  chevron:        { fontSize: 20, color: '#999' },
  infoCard:       { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, marginTop: 16 },
  infoLabel:      { fontSize: 12, fontWeight: 'bold', color: '#0D1B2A' },
  infoValue:      { fontSize: 14, color: '#1A1A1A', marginTop: 4, lineHeight: 20 },
  logoutButton:   { marginTop: 36, borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  logoutText:     { color: '#0D1B2A', fontWeight: 'bold', fontSize: 15 },
});