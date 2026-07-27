/**
 * Placeholder for the Messages tab when accessed via the tab bar
 * (not linked to a specific booking). Shows a conversation list stub.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eyebrow, ScreenTitle } from '../components/atoms';
import { Colors, Fonts, SCREEN_H_PADDING } from '../theme';

export default function MessagesTabPlaceholder() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Eyebrow>Inbox</Eyebrow>
        <ScreenTitle>Messages</ScreenTitle>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Messages linked to active bookings will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  header: {
    paddingHorizontal: SCREEN_H_PADDING,
    paddingTop: 22,
    paddingBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 20,
  },
});
