import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Fonts } from '../theme';

interface Props {
  size?: number;
  showText?: boolean;
}

/**
 * CareNest brand logo.
 * Shows a navy rounded-square icon mark (house + heart)
 * with "CareNest" wordmark below when showText=true.
 */
export default function CareNestLogo({ size = 64, showText = false }: Props) {
  const iconSize = Math.round(size * 0.6);
  const markSize = size;

  return (
    <View style={styles.wrap}>
      {/* Icon mark — navy square with house + heart */}
      <View
        style={[
          styles.mark,
          {
            width: markSize,
            height: markSize,
            borderRadius: markSize * 0.24,
          },
        ]}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none">
          {/* House */}
          <Path
            d="M8 24L24 10l16 14v14a2 2 0 01-2 2H10a2 2 0 01-2-2V24z"
            fill="none"
            stroke={Colors.goldLight}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Heart inside house */}
          <Path
            d="M24 34s-6-4-6-8a4 4 0 018 0 4 4 0 018 0c0 4-6 8-6 8"
            fill={Colors.goldLight}
            stroke={Colors.goldLight}
            strokeWidth="0.5"
          />
        </Svg>
      </View>

      {/* Wordmark */}
      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.wordmark, { fontSize: Math.round(size * 0.3) }]}>
            <Text style={styles.care}>Care</Text>
            <Text style={styles.nest}>Nest</Text>
          </Text>
          <Text style={[styles.tagline, { fontSize: Math.round(size * 0.11) }]}>
            Trusted domestic help
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  mark: {
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  wordmark: {
    fontFamily: Fonts.interBold,
    letterSpacing: -0.5,
  },
  care: {
    color: Colors.navy,
  },
  nest: {
    color: Colors.gold,
  },
  tagline: {
    fontFamily: Fonts.spaceMono,
    color: Colors.slateSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 5,
  },
});
