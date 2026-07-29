import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaymentInitResponse } from '../types';
import { initiatePayment } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Divider,
  ProgressBar,
  Row,
  ScreenTitle,
  Sub,
} from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Pay'>;

export default function PayScreen({ navigation, route }: Props) {
  const { booking, agency } = route.params;

  const [paymentInfo, setPaymentInfo] = useState<PaymentInitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { initPayment(); }, []);

  async function initPayment() {
    setLoading(true);
    setError(null);
    try {
      const info = await initiatePayment(booking.id);
      setPaymentInfo(info);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.message ??
        'Failed to initiate payment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPayment() {
    if (!paymentInfo?.authorizationUrl) return;
    setPaymentOpened(true);
    await WebBrowser.openBrowserAsync(paymentInfo.authorizationUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: Colors.navy,
    });
  }

  async function handleCopyLink() {
    if (!paymentInfo?.authorizationUrl) return;
    await Clipboard.setStringAsync(paymentInfo.authorizationUrl);
    setCopied(true);
    setPaymentOpened(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleContinue() {
    if (!paymentOpened) {
      Alert.alert(
        'Complete payment first',
        'Please open the payment link and complete payment before continuing.',
        [
          { text: 'Open payment', style: 'default', onPress: handleOpenPayment },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    // Confirm the user has paid
    Alert.alert(
      'Confirm payment',
      'Have you completed the payment on Paystack?',
      [
        {
          text: 'Yes, I have paid',
          style: 'default',
          onPress: () => navigation.navigate('Confirm', { booking }),
        },
        {
          text: 'Not yet — go back to pay',
          style: 'cancel',
          onPress: handleOpenPayment,
        },
      ],
    );
  }

  function formatGhs(minorUnits: number): string {
    return `GHS ${(minorUnits / 100).toFixed(2)}`;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }

  const subtotal  = booking.subtotalMinorUnits ?? 0;
  const fee       = Math.round(subtotal * 0.07);
  const total     = subtotal + fee;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => navigation.goBack()} />
        <ProgressBar current={2} total={3} />
        <ScreenTitle>Secure payment</ScreenTitle>
        <Sub>Funds are held securely and released to the agency once your booking is confirmed.</Sub>

        {/* Booking summary */}
        <View style={styles.summaryCard}>
          <Row label="Agency"   value={agency.name} />
          <Divider />
          <Row label="Service"  value={booking.category} />
          <Divider />
          <Row label="Start"    value={formatDate(booking.startTime)} />
          <Divider />
          <Row label="End"      value={formatDate(booking.endTime)} />
          <Divider />
          <Row label="Subtotal" value={formatGhs(subtotal)} />
          <Row label="CareNest fee (7%)" value={formatGhs(fee)} />
          <Divider />
          <Row
            label="Total"
            value={formatGhs(total)}
            valueStyle={{ fontFamily: Fonts.interBold, fontSize: 15 }}
          />
          <View style={styles.agencyNote}>
            <Text style={styles.agencyNoteText}>
              Agency receives {formatGhs(Math.round(subtotal * 0.93))} after platform fee
            </Text>
          </View>
        </View>

        {/* Payment section */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.navy} />
            <Text style={styles.loadingText}>Generating payment link…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={initPayment} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : paymentInfo ? (
          <>
            {/* Reference */}
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Paystack reference</Text>
              <Text style={styles.refValue}>{paymentInfo.paystackReference}</Text>
            </View>

            {/* Open in browser — primary action */}
            <TouchableOpacity
              onPress={handleOpenPayment}
              style={styles.payBtn}
              activeOpacity={0.85}
              accessibilityLabel="Open payment page"
              accessibilityRole="button"
            >
              <Text style={styles.payBtnText}>
                💳  Pay {formatGhs(total)} via Paystack
              </Text>
            </TouchableOpacity>

            {/* Fallback: copy link */}
            <TouchableOpacity
              onPress={handleCopyLink}
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              activeOpacity={0.8}
              accessibilityLabel={copied ? 'Payment link copied' : 'Copy payment link'}
              accessibilityRole="button"
            >
              <Text style={styles.copyBtnText}>
                {copied ? '✓ Link copied!' : 'Copy link instead'}
              </Text>
            </TouchableOpacity>

            {/* Status indicator */}
            {paymentOpened ? (
              <View style={styles.paidHint}>
                <Text style={styles.paidHintText}>
                  ✓ Payment page opened — tap Continue once you have completed payment.
                </Text>
              </View>
            ) : (
              <View style={styles.note}>
                <Text style={styles.noteText}>
                  Tapping Pay opens Paystack in your browser. Return here and tap Continue after payment.
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Continue CTA */}
        <View style={styles.ctaRow}>
          <Btn onPress={handleContinue}>
            {paymentOpened ? 'I have paid — Continue →' : 'Continue to confirmation →'}
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SCREEN_H_PADDING,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 16,
    padding: 16, marginVertical: 18,
    backgroundColor: Colors.paper,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  agencyNote: {
    marginTop: 8, backgroundColor: Colors.navyPale, borderRadius: 8, padding: 8,
  },
  agencyNoteText: {
    fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slate, textAlign: 'center',
  },
  loadingBox: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate },
  errorBox: { paddingVertical: 16, alignItems: 'center', gap: 10 },
  errorText: {
    fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 9, backgroundColor: Colors.navy,
  },
  retryText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.goldLight },
  refBox: {
    backgroundColor: Colors.navyPale, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  refLabel: {
    fontFamily: Fonts.spaceMonoBold, fontSize: 9, letterSpacing: 1,
    textTransform: 'uppercase', color: Colors.slateSoft, marginBottom: 4,
  },
  refValue: { fontFamily: Fonts.spaceMonoBold, fontSize: 13, color: Colors.navy },

  // Primary pay button
  payBtn: {
    backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 5,
  },
  payBtnText: { fontFamily: Fonts.interBold, fontSize: 15, color: Colors.goldLight },

  // Copy link fallback
  copyBtn: {
    borderWidth: 1.5, borderColor: Colors.line, borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 14,
  },
  copyBtnDone: { borderColor: Colors.success, borderStyle: 'solid' },
  copyBtnText: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.slate },

  // Hints
  note: {
    backgroundColor: Colors.navySubtle, borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.line,
  },
  noteText: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 19 },
  paidHint: {
    backgroundColor: Colors.successBg, borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.successBorder,
  },
  paidHintText: {
    fontFamily: Fonts.interSemiBold, fontSize: 12.5, color: Colors.success, lineHeight: 19,
  },
  ctaRow: { marginTop: 4 },
});
