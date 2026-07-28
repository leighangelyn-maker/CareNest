import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../theme';

interface Props {
  size?: number;
  showText?: boolean;
}

/**
 * CareNest brand wordmark.
 * "Care" in navy, "Nest" in gold — clean, text-only.
 */
export default function CareNestLogo({ size = 64, showText = false }: Props) {
  const fontSize = size * 0.34;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.wordmark, { fontSize }]}>
        <Text style={styles.care}>Care</Text>
        <Text style={styles.nest}>Nest</Text>
      </Text>
      {showText && (
        <Text style={[styles.tagline, { fontSize: fontSize * 0.38 }]}>
          Trusted domestic help
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordmark: {
    fontFamily: Fonts.interBold,
    letterSpacing: -0.5,
    lineHeight: undefined,
  },
  care: { color: Colors.navy },
  nest: { color: Colors.gold },
  tagline: {
    fontFamily: Fonts.spaceMono,
    color: Colors.slateSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
