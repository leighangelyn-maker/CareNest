import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList, ApiBooking, BookingStatus } from '../types';
import { useBookings } from '../BookingContext';
import { Btn, CalendarIcon, Eyebrow, ScreenTitle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING, TAB_BAR_HEIGHT } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_ASSIGNMENT: 'Pending',
  ASSIGNED:           'Assigned',
  IN_PROGRESS:        'In Progress',
  COMPLETED:          'Completed',
  CANCELLED:          'Cancelled',
};

function badgeStyle(status: BookingStatus) {
  switch (status) {
    case 'PENDING_ASSIGNMENT':
    case 'ASSIGNED':
      return { bg: 'rgba(201,162,39,0.14)', text: '#8a6c14' };
    case 'IN_PROGRESS':
      return { bg: 'rgba(11,31,58,0.1)', text: Colors.navy };
    case 'COMPLETED':
      return { bg: Colors.successBg, text: Colors.success };
    case 'CANCELLED':
      return { bg: 'rgba(90,90,100,0.12)', text: Colors.slate };
  }
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

export default function BookingsScreen({ navigation }: Props) {
  const { bookings, loading, error, fetchHistory } = useBookings();
  const insets = useSafeAreaInsets();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchHistory();
    }
  }, [fetchHistory]);

  if (loading && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Eyebrow>Your bookings</Eyebrow>
          <ScreenTitle>Upcoming & past</ScreenTitle>
        </View>
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Eyebrow>Your bookings</Eyebrow>
          <ScreenTitle>Upcoming & past</ScreenTitle>
        </View>
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: 16, width: '80%' }}>
            <Btn onPress={fetchHistory}>Retry</Btn>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Eyebrow>Your bookings</Eyebrow>
          <ScreenTitle>Upcoming & past</ScreenTitle>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <CalendarIcon />
          </View>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyBody}>
            Once you book an agency, it'll show up here with all the details.
          </Text>
          <View style={{ marginTop: 16, width: '100%' }}>
            <Btn onPress={() => navigation.navigate('MainTabs')}>Find an agency</Btn>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Eyebrow>Your bookings</Eyebrow>
        <ScreenTitle>Upcoming & past</ScreenTitle>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: b }) => {
          const { bg, text } = badgeStyle(b.status);
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
              activeOpacity={0.8}
            >
              <View style={styles.itemTop}>
                <Text style={styles.itemName}>
                  {b.agency.name} · {b.category}
                </Text>
                <View style={[styles.badge, { backgroundColor: bg }]}>
                  <Text style={[styles.badgeText, { color: text }]}>
                    {STATUS_LABEL[b.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>{formatDate(b.startTime)}</Text>
              {b.status === 'COMPLETED' && !b.reviewed && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Review', { bookingId: b.id })}
                  style={styles.reviewBtn}
                >
                  <Text style={styles.reviewBtnText}>Leave a review</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 22,
    paddingBottom: 10,
    flexShrink: 0,
  },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorText: { fontFamily: Fonts.inter, fontSize: 13, color: Colors.danger, textAlign: 'center', marginBottom: 4 },
  list: { paddingHorizontal: SCREEN_H_PADDING, paddingBottom: 14, gap: 10 },
  item: { borderWidth: 1, borderColor: Colors.line, borderRadius: 14, padding: 13 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontFamily: Fonts.interBold, fontSize: 13, color: Colors.navy, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontFamily: Fonts.interBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.4 },
  itemMeta: { fontFamily: Fonts.inter, fontSize: 11.5, color: Colors.slate, marginTop: 5 },
  reviewBtn: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.navy, alignSelf: 'flex-start' },
  reviewBtnText: { fontFamily: Fonts.interBold, fontSize: 12.5, color: Colors.navy },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { width: 56, height: 56, backgroundColor: Colors.navyPale, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: Fonts.interBold, fontSize: 13.5, color: Colors.navy, marginBottom: 4, textAlign: 'center' },
  emptyBody: { fontFamily: Fonts.inter, fontSize: 12.5, color: Colors.slate, lineHeight: 20, textAlign: 'center' },
});
