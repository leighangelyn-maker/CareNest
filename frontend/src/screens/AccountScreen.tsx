import React, { useState, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, Switch, Modal,
  Animated, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
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

function ChevronIcon({ open, color = Colors.slate }: { open: boolean; color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
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

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
      <Path d="M7 11V7a5 5 0 0110 0v4" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 16v-4M12 8h.01" />
    </Svg>
  );
}

function HelpIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

// ─── Expandable info card ─────────────────────────────────────────────────────
function InfoCard({ name, email, phone, role, bio, location }: {
  name: string; email: string; phone?: string | null;
  role: string; bio?: string | null; location?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
          <ChevronIcon open={open} color={Colors.paperFaint} />
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
    backgroundColor: Colors.navy, borderRadius: 16, padding: 18, marginBottom: 20,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 6,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  topLeft: { flex: 1, marginRight: 8 },
  name: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.paper },
  email: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.paperFaint, marginTop: 2 },
  roleBadge: {
    marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.goldTintSubtle,
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.goldTintRing,
  },
  roleText: { fontFamily: Fonts.spaceMonoBold, fontSize: 9.5, color: Colors.goldLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  extraRowFirst: { borderTopWidth: 1, borderTopColor: Colors.paperDivider, marginTop: 14, paddingTop: 14 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  extraLabel: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.paperMuted, flex: 0.4 },
  extraValue: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.paper, flex: 0.6, textAlign: 'right' },
});

// ─── Section row (expandable) ─────────────────────────────────────────────────
function SectionRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={sectionStyles.row} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <View style={sectionStyles.iconWrap}>{icon}</View>
        <Text style={sectionStyles.label}>{label}</Text>
        <ChevronIcon open={open} />
      </TouchableOpacity>
      {open && <View style={sectionStyles.body}>{children}</View>}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.navyPale, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink },
  body: { paddingBottom: 14 },
});

// ─── Change Password ──────────────────────────────────────────────────────────
function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!current || !next || !confirm) { setError('Fill in all fields.'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true); setError(null);
    try {
      await apiClient.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionRow icon={<LockIcon />} label="Change Password">
      <View style={pwStyles.container}>
        {success && <View style={pwStyles.successBox}><Text style={pwStyles.successText}>Password changed successfully.</Text></View>}
        {error && <View style={pwStyles.errorBox}><Text style={pwStyles.errorText}>{error}</Text></View>}
        <Text style={pwStyles.label}>Current password</Text>
        <TextInput style={pwStyles.input} value={current} onChangeText={v => { setCurrent(v); setError(null); }} secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.slateSoft} returnKeyType="next" />
        <Text style={pwStyles.label}>New password</Text>
        <TextInput style={pwStyles.input} value={next} onChangeText={v => { setNext(v); setError(null); }} secureTextEntry placeholder="Min 8 chars" placeholderTextColor={Colors.slateSoft} returnKeyType="next" />
        <Text style={pwStyles.label}>Confirm new password</Text>
        <TextInput style={pwStyles.input} value={confirm} onChangeText={v => { setConfirm(v); setError(null); }} secureTextEntry placeholder="Repeat new password" placeholderTextColor={Colors.slateSoft} returnKeyType="done" onSubmitEditing={handleSave} />
        <TouchableOpacity style={[pwStyles.btn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color={Colors.goldLight} /> : <Text style={pwStyles.btnText}>Update password</Text>}
        </TouchableOpacity>
      </View>
    </SectionRow>
  );
}

const pwStyles = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  label: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy, marginBottom: 5, marginTop: 10 },
  input: { ...inputStyle },
  btn: { backgroundColor: Colors.navy, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.goldLight },
  errorBox: { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: 8, padding: 10, marginBottom: 4 },
  errorText: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.danger },
  successBox: { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: Colors.successBorder, borderRadius: 8, padding: 10, marginBottom: 4 },
  successText: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.success },
});

// ─── About CareNest ───────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <SectionRow icon={<InfoIcon />} label="About CareNest">
      <View style={aboutStyles.container}>
        <Text style={aboutStyles.heading}>CareNest</Text>
        <Text style={aboutStyles.version}>Version 1.0.0</Text>
        <Text style={aboutStyles.body}>
          CareNest connects families with verified domestic care agencies across Ghana. Find trusted nannies, cleaners, cooks, caregivers, and more — all ID-checked and background-verified.
        </Text>
        <View style={aboutStyles.row}>
          <Text style={aboutStyles.metaLabel}>Platform</Text>
          <Text style={aboutStyles.metaValue}>React Native · Spring Boot</Text>
        </View>
        <View style={aboutStyles.row}>
          <Text style={aboutStyles.metaLabel}>Region</Text>
          <Text style={aboutStyles.metaValue}>Ghana</Text>
        </View>
        <View style={aboutStyles.row}>
          <Text style={aboutStyles.metaLabel}>Payments</Text>
          <Text style={aboutStyles.metaValue}>Secured by Paystack</Text>
        </View>
        <Text style={aboutStyles.legal}>© 2026 CareNest. All rights reserved.</Text>
      </View>
    </SectionRow>
  );
}

const aboutStyles = StyleSheet.create({
  container: { backgroundColor: Colors.navyPale, borderRadius: 12, padding: 16, marginBottom: 4 },
  heading: { fontFamily: Fonts.interBold, fontSize: 16, color: Colors.navy, marginBottom: 2 },
  version: { fontFamily: Fonts.spaceMonoBold, fontSize: 10, color: Colors.slateSoft, letterSpacing: 1, marginBottom: 10 },
  body: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.line },
  metaLabel: { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.slateSoft },
  metaValue: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.navy },
  legal: { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slateSoft, marginTop: 12, textAlign: 'center' },
});

// ─── Help & Support ───────────────────────────────────────────────────────────
const FAQS = [
  { q: 'How do I book an agency?', a: 'Search for agencies on the home screen, tap one you like, then tap "Book this agency". Choose your service, date, time, and submit your request.' },
  { q: 'How does payment work?', a: 'After your booking is confirmed, you call the agency to agree on a rate. Then enter the agreed amount in the app and pay securely via Paystack.' },
  { q: 'Can I cancel a booking?', a: 'Yes. Go to your Bookings tab, tap the booking, and select Cancel. Cancellation policies may vary by agency.' },
  { q: 'How do I change my profile information?', a: 'Tap the Edit button at the top right of this screen to update your name, phone, email, and other details.' },
  { q: 'Is my payment information safe?', a: 'Yes. Payments are processed by Paystack, a PCI-DSS compliant payment provider. CareNest never stores your card details.' },
  { q: 'How do I report a problem?', a: 'Email us at support@carenest.app and we\'ll get back to you within 24 hours.' },
];

function HelpSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SectionRow icon={<HelpIcon />} label="Help & Support">
      <View style={helpStyles.container}>
        {/* Contact card */}
        <View style={helpStyles.contactCard}>
          <View style={helpStyles.contactIcon}><MailIcon /></View>
          <View>
            <Text style={helpStyles.contactLabel}>Contact Support</Text>
            <Text style={helpStyles.contactEmail}>support@carenest.app</Text>
          </View>
        </View>

        <Text style={helpStyles.faqHeader}>Frequently Asked Questions</Text>

        {FAQS.map((faq, i) => (
          <View key={i} style={helpStyles.faqItem}>
            <TouchableOpacity
              style={helpStyles.faqRow}
              onPress={() => setOpenIndex(openIndex === i ? null : i)}
              activeOpacity={0.7}
            >
              <Text style={helpStyles.faqQ}>{faq.q}</Text>
              <ChevronIcon open={openIndex === i} />
            </TouchableOpacity>
            {openIndex === i && (
              <Text style={helpStyles.faqA}>{faq.a}</Text>
            )}
          </View>
        ))}
      </View>
    </SectionRow>
  );
}

const helpStyles = StyleSheet.create({
  container: { marginBottom: 4 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.navyPale, borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.line,
  },
  contactIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
  contactEmail: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slate, marginTop: 2 },
  faqHeader: { fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 10 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: Colors.line },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  faqQ: { flex: 1, fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.ink, marginRight: 10 },
  faqA: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20, paddingBottom: 14 },
});

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ visible, onClose, initialValues, onSave }: {
  visible: boolean; onClose: () => void;
  initialValues: { firstName: string; lastName: string; email: string; phone: string; location: string; bio: string };
  onSave: (v: typeof initialValues) => void;
}) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (visible) setForm(initialValues); }, [visible]);

  function set(key: keyof typeof form) {
    return (val: string) => setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onSave(form);
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={editStyles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <View style={editStyles.header}>
              <Text style={editStyles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={editStyles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={editStyles.avatarRow}>
              <View style={editStyles.avatarCircle}>
                <Text style={editStyles.avatarInitial}>
                  {[form.firstName?.charAt(0) ?? '', form.lastName?.charAt(0) ?? ''].filter(Boolean).join('').toUpperCase() || '?'}
                </Text>
              </View>
              <TouchableOpacity style={editStyles.cameraBtn} activeOpacity={0.8}>
                <CameraIcon />
              </TouchableOpacity>
              <Text style={editStyles.avatarHint}>Tap camera to change photo</Text>
            </View>
            <ScrollView contentContainerStyle={editStyles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.line },
  title: { fontFamily: Fonts.interBold, fontSize: 17, color: Colors.navy },
  cancelBtn: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.slate },
  avatarRow: { alignItems: 'center', paddingVertical: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: Fonts.interBold, fontSize: 32, color: Colors.goldLight },
  cameraBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.slate, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 28, right: '35%', borderWidth: 2, borderColor: Colors.paper },
  avatarHint: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft, marginTop: 4 },
  scroll: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 4, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.navy, marginBottom: 5, marginTop: 14 },
  input: { ...inputStyle },
  footer: { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.line },
  saveBtn: { backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center', shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
});

// ─── Logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({ visible, onCancel, onConfirm }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={logoutStyles.overlay}>
        <View style={logoutStyles.sheet}>
          <Text style={logoutStyles.title}>Log out?</Text>
          <Text style={logoutStyles.body}>Are you sure you want to log out of CareNest?</Text>
          <View style={logoutStyles.btnRow}>
            <TouchableOpacity onPress={onCancel} style={logoutStyles.cancelBtn} activeOpacity={0.75}>
              <Text style={logoutStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={logoutStyles.logoutBtn} activeOpacity={0.85}>
              <Text style={logoutStyles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const logoutStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.navyOverlay, alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { width: '100%', backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 28, paddingBottom: 40 },
  title: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 8 },
  body: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate, lineHeight: 21, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.line, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.navy },
  logoutBtn: { flex: 1, backgroundColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AccountScreen({ navigation }: Props) {
  const { name, firstName, lastName, email, role, token, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [localProfile, setLocalProfile] = useState({
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: email ?? '',
    phone: '',
    location: '',
    bio: '',
  });

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
          <Text style={styles.guestBody}>Log in to manage your account, view bookings and message agencies.</Text>
          <Btn onPress={() => navigation.navigate('Login')}>Log in →</Btn>
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Eyebrow>Account</Eyebrow>
            <ScreenTitle size={SCREEN_WIDTH < 360 ? 20 : 24}>My Profile</ScreenTitle>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.75}>
            <EditIcon />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <TouchableOpacity style={styles.avatarEditBadge} onPress={() => setShowEditModal(true)} activeOpacity={0.8}>
            <CameraIcon />
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <InfoCard
          name={displayName}
          email={localProfile.email}
          phone={localProfile.phone || null}
          role={roleLabel}
          bio={localProfile.bio || null}
          location={localProfile.location || null}
        />

        <Divider />

        {/* Notifications */}
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Text style={styles.settingsSubLabel}>
              {notificationsEnabled ? 'Booking updates, messages and reminders are on' : 'All notifications are turned off'}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: Colors.line, true: Colors.navy }}
            thumbColor={notificationsEnabled ? Colors.goldLight : Colors.slateSoft}
            ios_backgroundColor={Colors.line}
          />
        </View>

        <Divider />

        {/* Change password */}
        <ChangePasswordSection />

        <Divider />

        {/* About */}
        <AboutSection />

        <Divider />

        {/* Help & Support */}
        <HelpSection />

        <Divider />

        {/* Log out */}
        <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.logoutBtn} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialValues={localProfile}
        onSave={(vals) => setLocalProfile(vals)}
      />

      <LogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  container: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20 },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SCREEN_H_PADDING },
  guestTitle: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 10 },
  guestBody: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.slate, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: Colors.navy, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 12.5, color: Colors.navy },
  avatarRow: { alignItems: 'center', marginBottom: 20, position: 'relative', alignSelf: 'flex-start' },
  avatar: { width: SCREEN_WIDTH < 360 ? 64 : 76, height: SCREEN_WIDTH < 360 ? 64 : 76, borderRadius: SCREEN_WIDTH < 360 ? 32 : 38, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarText: { fontFamily: Fonts.interBold, fontSize: SCREEN_WIDTH < 360 ? 22 : 26, color: Colors.goldLight, letterSpacing: 1 },
  avatarEditBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.slate, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 0, right: -8, borderWidth: 2, borderColor: Colors.paper },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingsLabel: { fontFamily: Fonts.inter, fontSize: 14, color: Colors.ink },
  settingsSubLabel: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slateSoft, marginTop: 2, lineHeight: 16 },
  logoutBtn: { marginTop: 20, backgroundColor: Colors.danger, borderRadius: 12, paddingVertical: 15, alignItems: 'center', shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
});