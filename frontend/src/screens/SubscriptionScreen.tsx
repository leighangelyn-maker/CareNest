import React, { useEffect, useState } from 'react';
import {
  View, Text, ActivityIndicator,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import { BackBtn, Btn, Eyebrow, ScreenTitle, Sub, Divider } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

interface SubStatus {
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
}

export default function SubscriptionScreen({ navigation }: Props) {
  const { subscriptionStatus, refreshSubscriptionStatus } = useAuth();
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await apiClient.get<SubStatus>('/subscription/status');
      setStatus(res.data);
    } catch {
      setError('Failed to load subscription status.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setSubscribing(true);
    setError(null);
    try {
      const res = await apiClient.post<{ authorization_url: string; reference: string }>(
        '/subscription/initialize'
      );
      const url = res.data.authorization_url;
      if (!url) {
        setError('Could not initialize payment. Please try again.');
        return;
      }
      const result = await WebBrowser.openBrowserAsync(url);
      // After browser closes, refresh subscription status
      await refreshSubscriptionStatus();
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Payment initialization failed.');
    } finally {
      setSubscribing(false);
    }
  }

  function handleCancel() {
    Alert.alert(
      'Cancel subscription',
      'Are you sure you want to cancel your CareNest subscription? You will lose access to booking workers.',
      [
        { text: 'Keep subscription', style: 'cancel' },
        { text: 'Cancel subscription', style: 'destructive', onPress: doCancel },
      ]
    );
  }

  async function doCancel() {
    setCancelling(true);
    try {
      await apiClient.post('/subscription/cancel');
      await refreshSubscriptionStatus();
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  }

  const isActive = status?.subscriptionStatus === 'active';
  const isPastDue = status?.subscriptionStatus === 'past_due';

  function statusLabel(s: string) {
    switch (s) {
      case 'active': return 'Active';
      case 'past_due': return 'Past due';
      case 'cancelled': return 'Cancelled';
      default: return 'Inactive';
    }
  }

  function statusColor(s: string) {
    switch (s) {
      case 'active':    return Colors.goldLight;
      case 'past_due':  return Colors.pastDue;
      case 'cancelled': return Colors.cancelled;
      default:          return Colors.paperDim;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Eyebrow>Account · Subscription</Eyebrow>
        <ScreenTitle>CareNest Subscription</ScreenTitle>
        <Sub>An active subscription lets you post job requests and book verified workers.</Sub>

        {loading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : (
          <>
            {/* Status card */}
            <View style={styles.card}>
              <Text style={styles.planName}>Family Plan</Text>
              <Text style={styles.planPrice}>GHS 100 / month</Text>
              <View style={styles.cardDivider} />
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusValue, { color: statusColor(status?.subscriptionStatus ?? 'inactive') }]}>
                  {statusLabel(status?.subscriptionStatus ?? 'inactive')}
                </Text>
              </View>
              {status?.subscriptionExpiresAt ? (
                <>
                  <View style={styles.cardDivider} />
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>
                      {isActive ? 'Renews on' : 'Expired on'}
                    </Text>
                    <Text style={styles.statusValue}>
                      {new Date(status.subscriptionExpiresAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Past due warning */}
            {isPastDue && (
              <View style={styles.warningBanner}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#92610a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <Path d="M12 9v4M12 17h.01" />
                </Svg>
                <Text style={styles.warningText}>
                  Your last payment failed. Please resubscribe to restore access.
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Actions */}
            {!isActive ? (
              <Btn
                onPress={handleSubscribe}
                style={subscribing ? { opacity: 0.6, marginBottom: 12 } : { marginBottom: 12 }}
              >
                {subscribing ? 'Processing…' : 'Subscribe — GHS 100/month →'}
              </Btn>
            ) : (
              <Btn
                variant="ghost"
                onPress={handleCancel}
                style={{
                  marginBottom: 12,
                  borderColor: Colors.dangerBorder,
                  opacity: cancelling ? 0.6 : 1,
                }}
                textColor={Colors.danger}
              >
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </Btn>
            )}

            <Divider />

            <Text style={styles.note}>
              Payments are processed securely by Paystack. Your subscription auto-renews monthly and can be cancelled at any time.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { padding: SCREEN_H_PADDING, paddingTop: 16, paddingBottom: 40 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  card: {
    backgroundColor: Colors.navy,
    borderRadius: 18,
    padding: 22,
    marginVertical: 20,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  planName: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.paper, marginBottom: 4 },
  planPrice: { fontFamily: Fonts.spaceMonoBold, fontSize: 14, color: Colors.goldLight, marginBottom: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  statusLabel: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.paperFaint },
  statusValue: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.paper },
  warningBanner: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  warningText: {
    fontFamily: Fonts.inter, fontSize: 13,
    color: Colors.warning, lineHeight: 19, flex: 1,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger, fontSize: 13,
    fontFamily: Fonts.inter, lineHeight: 19,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.paperDivider,
    marginVertical: 2,
  },
  note: {
    fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slateSoft,
    lineHeight: 18, textAlign: 'center', marginTop: 12,
  },
});
