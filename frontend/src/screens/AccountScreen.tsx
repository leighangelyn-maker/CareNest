import React, { useState, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, Switch, Modal, Alert,
  Animated, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../AuthContext';
import { Eyebrow, ScreenTitle, Sub, Divider, Btn, inputStyle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Account'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Icons ────────────────────────────────────────────────────────────────────
function EditIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="2" strokeLinecap="round">
      <Path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.paper} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

// ─── Expandable info card ─────────────────────────────────────────────────────
function InfoCard({ name, email, phone, role, bio, location }: {
  name: string; email: string; phone?: string | null;
  role: string; bio?: string | null; location?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const anim       = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  function toggle() {
    const toValue = open ? 0 : 1;
    Animated.spring(anim, { toValue, useNativeDriver: false, tension: 70, friction: 12 }).start();
    setOpen(v => !v);
  }

  function onPressIn() {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  }
  function onPressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
  }

  const extraRows = [
    phone ? { label: 'Phone', value: phone } : null,
    location ? { label: 'Location', value: location } : null,
    bio ? { label: 'About', value: bio } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, extraRows.length * 56 + 8] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={toggle} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={cardStyles.card}>
      <View style={cardStyles.top}>
        <View style={cardStyles.topLeft}>
          <Text style={cardStyles.name}>{name}</Text>
          <Text style={cardStyles.email}>{email}</Text>
          <View style={cardStyles.roleBadge}>
            <Text style={cardStyles.roleText}>{role}</Text>
          </View>
        </View>
        <ChevronIcon open={open} />
      </View>

      <Animated.View style={{ overflow: 'hidden', maxHeight }}>
        {extraRows.map((row, i) => (
          <View key={row.label} style={[cardStyles.extraRow, i === 0 && cardStyles.extraRowFirst]}>
            <Text style={cardStyles.extraLabel}>{row.label}</Text>
            <Text style={cardStyles.extraValue} numberOfLines={2}>{row.value}</Text>
          </View>
        ))}
      </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  topLeft: { flex: 1, marginRight: 8 },
  name: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.paper },
  email: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.paperFaint, marginTop: 2 },
  roleBadge: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: Colors.goldTintSubtle, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.goldTintRing,
  },
  roleText: { fontFamily: Fonts.spaceMonoBold, fontSize: 9.5, color: Colors.goldLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  extraRowFirst: { borderTopWidth: 1, borderTopColor: Colors.paperDivider, marginTop: 14, paddingTop: 14 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  extraLabel: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.paperMuted, flex: 0.4 },
  extraValue: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.paper, flex: 0.6, textAlign: 'right' },
});

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ visible, onClose, initialValues, onSave }: {
  visible: boolean;
  onClose: () => void;
  initialValues: { firstName: string; lastName: string; email: string; phone: string; location: string; bio: string };
  onSave: (v: typeof initialValues) => Promise<void>;
}) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => { if (visible) { setForm(initialValues); setSaveError(null); } }, [visible]);

  function set(key: keyof typeof form) {
    return (val: string) => setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? e?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={editStyles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={editStyles.header}>
              <Text style={editStyles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={editStyles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Profile picture placeholder */}
            <View style={editStyles.avatarRow}>
              <View style={editStyles.avatarCircle}>
                <Text style={editStyles.avatarInitial}>
                  {[
                    form.firstName?.charAt(0) ?? '',
                    form.lastName?.charAt(0) ?? '',
                  ].filter(Boolean).join('').toUpperCase() || '?'}
                </Text>
              </View>
              <TouchableOpacity
                style={editStyles.cameraBtn}
                activeOpacity={0.8}
                accessibilityLabel="Change profile photo"
                accessibilityRole="button"
              >
                <CameraIcon />
              </TouchableOpacity>
              <Text style={editStyles.avatarHint}>Tap camera to change photo</Text>
            </View>

            <ScrollView
              contentContainerStyle={editStyles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={editStyles.row}>
                <View style={editStyles.halfField}>
                  <Text style={editStyles.label}>First name</Text>
                  <TextInput style={editStyles.input} value={form.firstName} onChangeText={set('firstName')} autoCapitalize="words" returnKeyType="next" />
                </View>
                <View style={editStyles.halfField}>
                  <Text style={editStyles.label}>Last name</Text>
                  <TextInput style={editStyles.input} value={form.lastName} onChangeText={set('lastName')} autoCapitalize="words" returnKeyType="next" />
                </View>
              </View>
              <Text style={editStyles.label}>Email</Text>
              <TextInput style={editStyles.input} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
              <Text style={editStyles.label}>Phone</Text>
              <TextInput style={editStyles.input} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" returnKeyType="next" />
              <Text style={editStyles.label}>Location</Text>
              <TextInput style={editStyles.input} value={form.location} onChangeText={set('location')} placeholder="e.g. Accra, Ghana" placeholderTextColor={Colors.slateSoft} returnKeyType="next" />
              <Text style={editStyles.label}>Bio</Text>
              <TextInput style={[editStyles.input, { height: 80, textAlignVertical: 'top' }]} value={form.bio} onChangeText={set('bio')} placeholder="Tell agencies a little about yourself…" placeholderTextColor={Colors.slateSoft} multiline blurOnSubmit />
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={editStyles.footer}>
              {saveError ? (
                <Text style={editStyles.saveError}>{saveError}</Text>
              ) : null}
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[editStyles.saveBtn, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={Colors.goldLight} /> : <Text style={editStyles.saveBtnText}>Save changes</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  title: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.navy },
  cancelBtn: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.slate },
  avatarRow: { alignItems: 'center', paddingVertical: 20 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: Fonts.interBold, fontSize: 32, color: Colors.goldLight },
  cameraBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.slate, alignItems: 'center', justifyContent: 'center',
    position: 'absolute', bottom: 28, right: '35%',
    borderWidth: 2, borderColor: Colors.paper,
  },
  avatarHint: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft, marginTop: 4 },
  scroll: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 4, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.navy, marginBottom: 5, marginTop: 14 },
  input: { ...inputStyle },
  footer: { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.line },
  saveError: {
    fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.danger,
    marginBottom: 8, textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
});

// ─── Logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({ visible, onCancel, onConfirm }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={logoutStyles.overlay}>
        <Animated.View style={logoutStyles.sheet}>
          <Text style={logoutStyles.title}>Log out?</Text>
          <Text style={logoutStyles.body}>Are you sure you want to log out?</Text>
          <View style={logoutStyles.btnRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={logoutStyles.cancelBtn}
              activeOpacity={0.75}
              accessibilityLabel="Cancel logout"
              accessibilityRole="button"
            >
              <Text style={logoutStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={logoutStyles.logoutBtn}
              activeOpacity={0.85}
              accessibilityLabel="Confirm log out"
              accessibilityRole="button"
            >
              <Text style={logoutStyles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const logoutStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: Colors.navyOverlay,
    alignItems: 'center', justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%', backgroundColor: Colors.paper,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 28, paddingBottom: 40,
  },
  title: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 8 },
  body: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate, lineHeight: 21, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.line,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.navy },
  logoutBtn: {
    flex: 1, backgroundColor: Colors.danger,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AccountScreen({ navigation }: Props) {
  const { name, firstName, lastName, email, role, token, logout, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load persisted notification preference
  React.useEffect(() => {
    AsyncStorage.getItem('@carenest_notifications').then(val => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    });
  }, []);

  function handleNotificationToggle(val: boolean) {
    setNotificationsEnabled(val);
    AsyncStorage.setItem('@carenest_notifications', String(val));
  }

  // Local profile overrides (saved locally until backend supports PATCH /me)
  const [localProfile, setLocalProfile] = useState({
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: email ?? '',
    phone: '',
    location: '',
    bio: '',
  });

  // Keep in sync if auth context updates
  React.useEffect(() => {
    setLocalProfile(p => ({
      ...p,
      firstName: firstName ?? p.firstName,
      lastName: lastName ?? p.lastName,
      email: email ?? p.email,
    }));
  }, [firstName, lastName, email]);

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Not logged in</Text>
          <Text style={styles.guestBody}>
            Log in to manage your account, view bookings and message agencies.
          </Text>
          <Btn onPress={() => navigation.navigate('Login')}>
            Log in →
          </Btn>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = localProfile.firstName && localProfile.lastName
    ? `${localProfile.firstName} ${localProfile.lastName}`
    : name ?? 'My Account';
  const avatarInitials = [
    localProfile.firstName?.charAt(0) ?? '',
    localProfile.lastName?.charAt(0) ?? '',
  ].filter(Boolean).join('').toUpperCase() || '?';
  const roleLabel =
    role === 'FAMILY' ? 'Family account' :
    role === 'AGENCY_ADMIN' ? 'Agency account' :
    role === 'ADMIN' ? 'Admin account' : 'Account';

  async function handleLogoutConfirm() {
    setShowLogoutModal(false);
    await logout();
    navigation.navigate('Login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Eyebrow>Account</Eyebrow>
            <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>My Profile</ScreenTitle>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.75}
          >
            <EditIcon />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarEditBadge}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Edit profile photo"
            accessibilityRole="button"
          >
            <CameraIcon />
          </TouchableOpacity>
        </View>

        {/* Expandable info card */}
        <InfoCard
          name={displayName}
          email={localProfile.email}
          phone={localProfile.phone || null}
          role={roleLabel}
          bio={localProfile.bio || null}
          location={localProfile.location || null}
        />

        <Divider />

        {/* Notifications toggle */}
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Text style={styles.settingsSubLabel}>
              {notificationsEnabled ? 'Booking updates, messages and reminders are on' : 'All notifications are turned off'}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: Colors.line, true: Colors.navy }}
            thumbColor={notificationsEnabled ? Colors.goldLight : Colors.slateSoft}
            ios_backgroundColor={Colors.line}
          />
        </View>

        <Divider />

        {/* Log out */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={styles.logoutBtn}
          activeOpacity={0.85}
          accessibilityLabel="Log out of CareNest"
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialValues={localProfile}
        onSave={async (vals) => {
          await updateProfile({
            firstName: vals.firstName,
            lastName:  vals.lastName,
            email:     vals.email,
            phone:     vals.phone,
            location:  vals.location,
            bio:       vals.bio,
          });
          setLocalProfile(vals);
        }}
      />

      <LogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20 },

  // Guest
  guestContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SCREEN_H_PADDING,
  },
  guestTitle: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 10 },
  guestBody: {
    fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate,
    textAlign: 'center', marginBottom: 24, lineHeight: 21,
  },

  // Header
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.navy,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  editBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 12.5, color: Colors.navy },

  // Avatar
  avatarRow: { alignItems: 'center', marginBottom: 20, position: 'relative', alignSelf: 'flex-start' },
  avatar: {
    width: SCREEN_WIDTH < 360 ? 64 : 76,
    height: SCREEN_WIDTH < 360 ? 64 : 76,
    borderRadius: SCREEN_WIDTH < 360 ? 32 : 38,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  avatarText: {
    fontFamily: Fonts.interBold,
    fontSize: SCREEN_WIDTH < 360 ? 22 : 26,
    color: Colors.goldLight,
    letterSpacing: 1,
  },
  avatarEditBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.slate,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', bottom: 0, right: -8,
    borderWidth: 2, borderColor: Colors.paper,
  },

  // Settings row
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
  },
  settingsLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink },
  settingsSubLabel: {
    fontFamily: Fonts.inter, fontSize: 11.5,
    color: Colors.slateSoft, marginTop: 2, lineHeight: 16,
  },

  // Logout
  logoutBtn: {
    marginTop: 20,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
});
