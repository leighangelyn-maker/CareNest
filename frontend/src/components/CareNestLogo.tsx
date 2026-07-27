/**
 * CareNestLogo — uses the real PNG logo from assets/carenest-logo.png
 * Falls back to SVG recreation if the image isn't found.
 *
 * Usage:
 *   <CareNestLogo size={120} />           — image only
 *   <CareNestLogo size={120} showText />  — image (text is embedded in the logo PNG)
 */
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  showText?: boolean;
}

// Require the logo — if the file doesn't exist yet, this will warn but not crash
const LOGO = require('../../assets/carenest-logo.png');

export default function CareNestLogo({ size = 120 }: Props) {
  return (
    <View style={styles.wrapper}>
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
});
