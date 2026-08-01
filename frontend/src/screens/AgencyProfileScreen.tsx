import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Switch, Modal, TextInput,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { RootStackParamList, AgencyProfile } from '../types';
import { getAgency } from '../api/agencies';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import { StarIcon, Sub, inputStyle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgencyProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ChevronIcon({ open, color = Colors.slate }: { open: boolean; color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <Path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
    </Svg>
  );
}

function EditIcon({ color = Colors.navy }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function SectionRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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
    } finally { setSaving(false); }
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

function AboutSection() {
  return (
    <SectionRow icon={<InfoIcon />} label="About CareNest">
      <View style={aboutStyles.container}>
        <Text style={aboutStyles.heading}>CareNest</Text>
        <Text style={aboutStyles.version}>Version 1.0.0</Text>
        <Text style={aboutStyles.body}>
          CareNest connects families with verified domestic care agencies across Ghana. Find trusted nannies, cleaners, cooks, caregivers, and more — all ID-checked and background-verified.
        </Text>
        <View style={aboutStyles.row}><Text style={aboutStyles.metaLabel}>Platform</Text><Text style={aboutStyles.metaValue}>React Native · Spring Boot</Text></View>
        <View style={aboutStyles.row}><Text style={aboutStyles.metaLabel}>Region</Text><Text style={aboutStyles.metaValue}>Ghana</Text></View>
        <View style={aboutStyles.row}><Text style={aboutStyles.metaLabel}>Payments</Text><Text style={aboutStyles.metaValue}>Secured by Paystack</Text></View>
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

const FAQS = [
  { q: 'How do families find my agency?', a: 'Families search by service type and location. Make sure your agency description and services are complete to appear in more results.' },
  { q: 'How do I confirm a booking?', a: 'When a family books you, it appears in your Bookings tab as Pending. Assign a worker to confirm it.' },
  { q: 'How does payment work for agencies?', a: 'The family pays through the app after you agree on a rate. CareNest takes a 7% platform fee; you receive the rest directly via Paystack.' },
  { q: 'How do I add workers to my agency?', a: 'Workers can register separately and request to join your agency. Agency worker management is available in the Workers section.' },
  { q: 'Can I pause bookings temporarily?', a: 'Yes — use the "Accepting Bookings" toggle on this profile screen to pause new bookings while keeping your listing visible.' },
  { q: 'How do I report a problem?', a: "Email us at support@carenest.app and we'll get back to you within 24 hours." },
];

function HelpSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <SectionRow icon={<HelpIcon />} label="Help & Support">
      <View style={helpStyles.container}>
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
            <TouchableOpacity style={helpStyles.faqRow} onPress={() => setOpenIndex(openIndex === i ? null : i)} activeOpacity={0.7}>
              <Text style={helpStyles.faqQ}>{faq.q}</Text>
              <ChevronIcon open={openIndex === i} />
            </TouchableOpacity>
            {openIndex === i && <Text style={helpStyles.faqA}>{faq.a}</Text>}
          </View>
        ))}
      </View>
    </SectionRow>
  );
}

const helpStyles = StyleSheet.create({
  container: { marginBottom: 4 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.navyPale, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.line },
  contactIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
  contactEmail: { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slate, marginTop: 2 },
  faqHeader: { fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 10 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: Colors.line },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  faqQ: { flex: 1, fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.ink, marginRight: 10 },
  faqA: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate, lineHeight: 20, paddingBottom: 14 },
});

function EditAgencyModal({ visible, onClose, initialValues, onSave }: {
  visible: boolean; onClose: () => void;
  initialValues: { name: string; description: string; phone: string };
  onSave: (v: typeof initialValues) => void;
}) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => { if (visible) { setForm(initialValues); setError(null); } }, [visible]);

  async function handleSave() {
    if (!form.name.trim()) { setError('Agency name is required.'); return; }
    setSaving(true); setError(null);
    try {
      await apiClient.patch('/agencies/me', {
        name: form.name.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
      });
      onSave(form);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to save changes.');
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={editStyles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <View style={editStyles.header}>
              <Text style={editStyles.title}>Edit Agency</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={editStyles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={editStyles.scroll} keyboardShouldPersistTaps="handled">
              {error && <View style={editStyles.errorBox}><Text style={editStyles.errorText}>{error}</Text></View>}
              <Text style={editStyles.label}>Agency name *</Text>
              <TextInput style={editStyles.input} value={form.name} onChangeText={v => { setForm(f => ({ ...f, name: v })); setError(null); }} autoCapitalize="words" returnKeyType="next" />
              <Text style={editStyles.label}>Phone</Text>
              <TextInput style={editStyles.input} value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" returnKeyType="next" />
              <Text style={editStyles.label}>Description</Text>
              <TextInput style={[editStyles.input, { height: 100, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Tell families about your agency…" placeholderTextColor={Colors.slateSoft} multiline blurOnSubmit />
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
  scroll: { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 16, paddingBottom: 8 },
  label: { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.navy, marginBottom: 5, marginTop: 14 },
  input: { ...inputStyle },
  errorBox: { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.danger },
  footer: { paddingHorizontal: SCREEN_H_PADDING, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.line },
  saveBtn: { backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
});

function LogoutModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
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
  logoutBtn: { flex: 1, backgroundColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
});

export default function AgencyProfileScreen({ navigation, route }: Props) {
  const { agencyId: myAgencyId, role, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const paramAgency = route.params?.agency ?? null;
  const agencyId = paramAgency?.id ?? myAgencyId ?? null;
  const isOwnProfile = role === 'AGENCY_ADMIN' && !paramAgency;

  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(true);
  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localEdits, setLocalEdits] = useState({ name: '', description: '', phone: '' });

  useEffect(() => { if (agencyId) loadProfile(); }, [agencyId]);

  async function loadProfile() {
    if (!agencyId) { setError('No agency found.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await getAgency(agencyId);
      setProfile(data);
      setIsAccepting(data.isAcceptingBookings ?? true);
      setLocalEdits({ name: data.name ?? '', description: data.description ?? '', phone: (data as any).phone ?? '' });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load agency profile');
    } finally { setLoading(false); }
  }

  async function handleToggleAccepting() {
    if (!agencyId) return;
    setTogglingAccepting(true);
    try {
      await apiClient.patch('/agencies/me', { isAcceptingBookings: !isAccepting });
      setIsAccepting(v => !v);
    } catch {}
    finally { setTogglingAccepting(false); }
  }

  async function handleLogoutConfirm() {
    setShowLogoutModal(false);
    await logout();
    navigation.navigate('Login');
  }

  const display = profile ?? paramAgency ?? null;

  if (!display && loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={Colors.navy} size="large" />
      </SafeAreaView>
    );
  }

  if (!display) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error ?? 'Agency not found.'}</Text>
          <TouchableOpacity onPress={loadProfile} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const agencyName = localEdits.name || display.name || 'My Agency';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        {!isOwnProfile && navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.paper} strokeWidth="2" strokeLinecap="round">
              <Path d="M19 12H5M12 5l-7 7 7 7" />
            </Svg>
          </TouchableOpacity>
        )}
        {isOwnProfile && <Text style={styles.ownLabel}>MY AGENCY</Text>}

        <View style={styles.heroRow}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitial}>{agencyName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={2}>{agencyName}</Text>
            <View style={styles.heroMeta}>
              <StarIcon filled />
              <Text style={styles.heroRating}>
                {typeof display.averageRating === 'number' ? display.averageRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.heroReviews}>({display.totalReviews ?? 0} reviews)</Text>
              <View style={[styles.badge, isAccepting ? styles.badgeOpen : styles.badgePaused]}>
                <Text style={[styles.badgeText, isAccepting ? styles.badgeTextOpen : styles.badgeTextPaused]}>
                  {isAccepting ? '✓ Open' : 'Paused'}
                </Text>
              </View>
            </View>
          </View>
          {isOwnProfile && (
            <TouchableOpacity style={styles.editAgencyBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.8}>
              <EditIcon color={Colors.goldLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {isOwnProfile && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(display as any).totalBookings ?? 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.gold }]}>
                {typeof display.averageRating === 'number' ? display.averageRating.toFixed(1) : '—'}★
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(display as any).workerCount ?? 0}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </View>
          </View>
        )}

        {/* Accepting bookings toggle */}
        {isOwnProfile && (
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Accepting bookings</Text>
              <Text style={styles.toggleSub}>
                {isAccepting ? 'Families can book your agency right now' : 'New bookings are paused'}
              </Text>
            </View>
            <Switch
              value={isAccepting}
              onValueChange={handleToggleAccepting}
              disabled={togglingAccepting}
              trackColor={{ false: Colors.line, true: Colors.navy }}
              thumbColor={isAccepting ? Colors.goldLight : Colors.slateSoft}
              ios_backgroundColor={Colors.line}
            />
          </View>
        )}

        {/* Description */}
        {(localEdits.description || display.description) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Sub>{localEdits.description || display.description}</Sub>
          </View>
        ) : null}

        {/* Services */}
        {profile?.categories && profile.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services offered</Text>
            <View style={styles.chipRow}>
              {profile.categories.map(cat => (
                <View key={cat} style={styles.chip}>
                  <Text style={styles.chipText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Own profile settings */}
        {isOwnProfile && (
          <>
            <ChangePasswordSection />
            <View style={styles.divider} />
            <AboutSection />
            <View style={styles.divider} />
            <HelpSection />
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.logoutBtn} activeOpacity={0.85}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Book CTA for viewing another agency */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.bookBtn, !isAccepting && styles.bookBtnDisabled]}
            onPress={() => isAccepting && navigation.navigate('BookAgency', { agency: display! })}
            activeOpacity={isAccepting ? 0.85 : 1}
          >
            <Text style={styles.bookBtnText}>
              {isAccepting ? 'Book this agency →' : 'Not accepting bookings right now'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {isOwnProfile && (
        <>
          <EditAgencyModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            initialValues={localEdits}
            onSave={(vals) => setLocalEdits(vals)}
          />
          <LogoutModal
            visible={showLogoutModal}
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={handleLogoutConfirm}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.paper },
  hero:           { backgroundColor: Colors.navy, paddingHorizontal: SCREEN_H_PADDING, paddingTop: 4, paddingBottom: 22, overflow: 'hidden' },
  heroBg:         { position: 'absolute', right: -36, top: -36, width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: Colors.goldTint },
  ownLabel:       { fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.5, color: Colors.goldLight, marginBottom: 10, marginTop: 4 },
  backBtn:        { marginBottom: 10 },
  heroRow:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatar:     { width: SCREEN_WIDTH < 360 ? 52 : 64, height: SCREEN_WIDTH < 360 ? 52 : 64, borderRadius: 14, backgroundColor: Colors.goldTint, borderWidth: 1.5, borderColor: Colors.goldTintBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroInitial:    { fontFamily: Fonts.interBold, fontSize: SCREEN_WIDTH < 360 ? 22 : 26, color: Colors.goldLight },
  heroInfo:       { flex: 1 },
  heroName:       { fontFamily: Fonts.interBold, fontSize: SCREEN_WIDTH < 360 ? 17 : 20, color: Colors.paper, lineHeight: 26 },
  heroMeta:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, flexWrap: 'wrap' },
  heroRating:     { fontFamily: Fonts.interBold, fontSize: 12, color: Colors.goldLight },
  heroReviews:    { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.paperFaint },
  editAgencyBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  badge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  badgeOpen:      { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: Colors.successBorder },
  badgePaused:    { backgroundColor: Colors.paperSubtle, borderWidth: 1, borderColor: Colors.paperDivider },
  badgeText:      { fontFamily: Fonts.interSemiBold, fontSize: 10 },
  badgeTextOpen:  { color: Colors.verifiedGreen },
  badgeTextPaused:{ color: Colors.paperDim },
  scroll:         { paddingHorizontal: SCREEN_H_PADDING, paddingTop: 20 },
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:       { flex: 1, backgroundColor: Colors.navyPale, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.line },
  statValue:      { fontFamily: Fonts.interBold, fontSize: 22, color: Colors.navy, marginBottom: 4 },
  statLabel:      { fontFamily: Fonts.inter, fontSize: 11, color: Colors.slateSoft, textAlign: 'center' },
  toggleRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.navyPale, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.line, gap: 12 },
  toggleLabel:    { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.ink },
  toggleSub:      { fontFamily: Fonts.inter, fontSize: 12, color: Colors.slateSoft, marginTop: 2 },
  section:        { marginBottom: 20 },
  sectionTitle:   { fontFamily: Fonts.spaceMonoBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 10 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip:           { backgroundColor: Colors.navyPale, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: Colors.line },
  chipText:       { fontFamily: Fonts.interSemiBold, fontSize: 12, color: Colors.navy },
  divider:        { height: 1, backgroundColor: Colors.line, marginVertical: 8 },
  logoutBtn:      { marginTop: 16, backgroundColor: Colors.danger, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  logoutText:     { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.paper },
  bookBtn:        { backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  bookBtnDisabled:{ backgroundColor: Colors.line },
  bookBtnText:    { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  errorWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText:      { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center' },
  retryBtn:       { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.navyPale },
  retryText:      { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
});