import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaymentInitResponse } from '../types';
import { initiatePayment } from '../api/bookings';
import {
  BackBtn,
  Btn,
  Divider,
  Eyebrow,
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

  useEffect(() => {
    initPayment();
  }, []);

  async function initPayment() {
    setLoading(true);
    setError(null);
    try {
      const info = await initiatePayment(booking.id);
      setPaymentInfo(info);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? 'Failed to initiate payment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!paymentInfo?.authorizationUrl) return;
    await Clipboard.setStringAsync(paymentInfo.authorizationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatGhs(minorUnits: number): string {
    return `GHS ${(minorUnits / 100).toFixed(2)}`;
  }

  function formatDate(iso: string): string {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.paper }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Step 2 of 3 · Payment</Eyebrow>
        <ScreenTitle>Secure payment</ScreenTitle>
        <Sub>Funds are held by CareNest and released to the agency once the job is confirmed.</Sub>

        {/* Booking summary */}
        <View style={styles.summaryCard}>
          <Row label="Agency" value={agency.name} />
          <Divider />
          <Row label="Service" value={booking.category} />
          <Divider />
          <Row label="Start" value={formatDate(booking.startTime)} />
          <Divider />
          <Row label="End" value={formatDate(booking.endTime)} />
          <Divider />
          {/* Show fee breakdown: agency gets 93%, CareNest takes 7% */}
          <Row
            label="Service subtotal"
            value={formatGhs(booking.subtotalMinorUnits)}
          />
          <Row
            label="CareNest fee (7%)"
            value={formatGhs(Math.round(booking.subtotalMinorUnits * 0.07))}
          />
          <Divider />
          <Row
            label="Total you pay"
            value={formatGhs(booking.subtotalMinorUnits + Math.round(booking.subtotalMinorUnits * 0.07))}
            valueStyle={{ fontFamily: Fonts.interBold, fontSize: 15 }}
          />
          <View style={styles.agencyNote}>
            <Text style={styles.agencyNoteText}>
              Agency receives {formatGhs(Math.round(booking.subtotalMinorUnits * 0.93))} (93%)
            </Text>
          </View>
        </View>

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
            <TouchableOpacity
              onPress={() => navigation.navigate('Confirm', { booking })}
              style={[styles.retryBtn, { marginTop: 8, backgroundColor: Colors.navyPale }]}
            >
              <Text style={[styles.retryText, { color: Colors.slate }]}>
                Skip to confirmation
              </Text>
            </TouchableOpacity>
          </View>
        ) : paymentInfo ? (
          <>
            {/* Paystack reference */}
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Paystack reference</Text>
              <Text style={styles.refValue}>{paymentInfo.paystackReference}</Text>
            </View>

            {/* Payment URL */}
            <View style={styles.urlBox}>
              <Text style={styles.urlLabel}>Payment link</Text>
              <Text style={styles.urlValue} numberOfLines={2}>
                {paymentInfo.authorizationUrl}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCopyLink}
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>
                {copied ? '✓ Copied!' : 'Copy payment link'}
              </Text>
            </TouchableOpacity>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                Open the payment link in your browser to complete payment via Paystack, then tap Continue.
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.ctaRow}>
          <Btn onPress={() => navigation.navigate('Confirm', { booking })}>
            Continue to confirmation →
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SCREEN_H_PADDING,
    paddingTop: 22,
    paddingBottom: 40,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 14,
    marginVertical: 18,
  },
  agencyNote: {
    marginTop: 8,
    backgroundColor: Colors.navyPale,
    borderRadius: 8,
    padding: 8,
  },
  agencyNoteText: {
    fontFamily: Fonts.inter,
    fontSize: 11.5,
    color: Colors.slate,
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.slate,
  },
  errorBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: Colors.navy,
  },
  retryText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 13,
    color: Colors.goldLight,
  },
  refBox: {
    backgroundColor: Colors.navyPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  refLabel: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.slateSoft,
    marginBottom: 4,
  },
  refValue: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 13,
    color: Colors.navy,
  },
  urlBox: {
    backgroundColor: Colors.navyPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  urlLabel: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.slateSoft,
    marginBottom: 4,
  },
  urlValue: {
    fontFamily: Fonts.inter,
    fontSize: 11.5,
    color: Colors.slate,
    lineHeight: 17,
  },
  copyBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  copyBtnDone: {
    backgroundColor: Colors.success,
  },
  copyBtnText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14,
    color: Colors.goldLight,
  },
  note: {
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
    marginBottom: 16,
  },
  noteText: {
    fontFamily: Fonts.inter,
    fontSize: 12.5,
    color: '#8a6c14',
    lineHeight: 19,
  },
  ctaRow: {
    marginTop: 4,
  },
});
