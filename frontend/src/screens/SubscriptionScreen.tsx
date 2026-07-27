import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../AuthContext';
import apiClient from '../api/client';
import { BackBtn, Eyebrow, ScreenTitle, Sub, Divider, Row } from '../components/atoms';
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
      case 'active': return Colors.success;
      case 'past_due': return Colors.gold;
      case 'cancelled': return Colors.danger;
      default: return Colors.slate;
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
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusValue, { color: statusColor(status?.subscriptionStatus ?? 'inactive') }]}>
                  {statusLabel(status?.subscriptionStatus ?? 'inactive')}
                </Text>
              </View>
              {status?.subscriptionExpiresAt ? (
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
              ) : null}
            </View>

            {/* Past due warning */}
            {isPastDue && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  Your last payment failed. Please resubscribe to restore access.
                </Text>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Actions */}
            {!isActive ? (
              <TouchableOpacity
                onPress={handleSubscribe}
                disabled={subscribing}
                style={[styles.btn, subscribing && { opacity: 0.6 }]}
              >
                {subscribing
                  ? <ActivityIndicator color={Colors.goldLight} />
                  : <Text style={styles.btnText}>Subscribe — GHS 100/month →</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelling}
                style={[styles.btnCancel, cancelling && { opacity: 0.6 }]}
              >
                {cancelling
                  ? <ActivityIndicator color={Colors.danger} />
                  : <Text style={styles.btnCancelText}>Cancel subscription</Text>}
              </TouchableOpacity>
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
    backgroundColor: Colors.navyPale,
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  planName: { fontFamily: Fonts.interBold, fontSize: 18, color: Colors.navy, marginBottom: 4 },
  planPrice: { fontFamily: Fonts.spaceMonoBold, fontSize: 14, color: Colors.gold, marginBottom: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statusLabel: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.slate },
  statusValue: { fontFamily: Fonts.interSemiBold, fontSize: 13, color: Colors.navy },
  warningBanner: {
    backgroundColor: 'rgba(201,162,39,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.3)',
  },
  warningText: { fontFamily: Fonts.inter, fontSize: 13, color: '#8a6c14', lineHeight: 19 },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, fontFamily: Fonts.inter },
  btn: {
    width: '100%', backgroundColor: Colors.navy, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  btnText: { fontFamily: Fonts.interSemiBold, fontSize: 15, color: Colors.goldLight },
  btnCancel: {
    width: '100%', borderWidth: 1.5, borderColor: 'rgba(181,70,47,0.4)',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  btnCancelText: { fontFamily: Fonts.interSemiBold, fontSize: 14, color: Colors.danger },
  note: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slateSoft, lineHeight: 18, textAlign: 'center', marginTop: 12 },
});
