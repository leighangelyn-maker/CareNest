import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../AuthContext';
import { Eyebrow, ScreenTitle, Sub, Divider } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Account'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SettingsRow({ label, value, onPress, valueColor }: {
  label: string; value: string; onPress?: () => void; valueColor?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.settingsRow} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={[styles.settingsValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen({ navigation }: Props) {
  const { name, firstName, email, role, token, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // If not logged in, show login prompt instead of account screen
  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center', padding: SCREEN_H_PADDING }}>
        <Text style={{ fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 10 }}>
          Not logged in
        </Text>
        <Text style={{ fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate, textAlign: 'center', marginBottom: 24, lineHeight: 21 }}>
          Log in to manage your account, view bookings and message agencies.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
        >
          <Text style={{ fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight }}>
            Log in →
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayName = name ?? 'My Account';
  const avatarInitial = firstName?.charAt(0).toUpperCase() ?? '?';

  const roleLabel =
    role === 'FAMILY' ? 'Family account' :
    role === 'AGENCY_ADMIN' ? 'Agency account' :
    role === 'ADMIN' ? 'Admin account' : 'Account';

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>Account</Eyebrow>
            <ScreenTitle size={SCREEN_WIDTH < 360 ? 18 : 22}>{displayName}</ScreenTitle>
            <Sub>{roleLabel}</Sub>
            {email ? <Text style={styles.emailText}>{email}</Text> : null}
          </View>
        </View>

        <Divider />

        <SettingsRow label="Notifications" value="On" />
        <Divider />

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SCREEN_H_PADDING, paddingTop: 18 },
  profileHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  avatar: {
    width: SCREEN_WIDTH < 360 ? 46 : 54, height: SCREEN_WIDTH < 360 ? 46 : 54,
    borderRadius: 12, backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: Fonts.interBold, fontSize: SCREEN_WIDTH < 360 ? 18 : 22, color: Colors.goldLight },
  emailText: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft, marginTop: 2 },
  sectionTitle: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: Colors.slateSoft, paddingTop: 14, paddingBottom: 6,
  },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, alignItems: 'center' },
  settingsLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink, flex: 1 },
  settingsValue: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.navy },
  logoutBtn: {
    marginTop: 20, borderWidth: 1.5, borderColor: 'rgba(181,70,47,0.3)',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.danger },
});
