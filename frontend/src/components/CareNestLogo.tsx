import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Fonts } from '../theme';

interface Props {
  size?: number;
  showText?: boolean;
}

export default function CareNestLogo({ size = 64, showText = false }: Props) {
  const iconSize = size * 0.55;

  return (
    <View style={styles.wrap}>
      {/* Icon mark */}
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.24 }]}>
        {/* House + heart */}
        <Svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
        >
          {/* House outline */}
          <Path
            d="M6 20L20 8l14 12v12a2 2 0 01-2 2H8a2 2 0 01-2-2V20z"
            fill="none"
            stroke={Colors.goldLight}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Heart inside house */}
          <Path
            d="M20 28s-5-3.3-5-6.5A3 3 0 0120 19a3 3 0 015 2.5C25 24.7 20 28 20 28z"
            fill={Colors.goldLight}
          />
        </Svg>
      </View>

      {/* Wordmark */}
      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.wordmark, { fontSize: size * 0.36 }]}>
            CareNest
          </Text>
          <Text style={[styles.tagline, { fontSize: size * 0.14 }]}>
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
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  wordmark: {
    fontFamily: Fonts.interBold,
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.spaceMono,
    color: Colors.slateSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 3,
  },
});
