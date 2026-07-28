/**
 * Shared UI atoms — mirrors the web prototype's helper components.
 * All layout uses React Native's StyleSheet / Flexbox; no CSS vars.
 */
import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TextStyle,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, Fonts, Typography, SCREEN_H_PADDING } from '../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
}

// ─── Typography atoms ─────────────────────────────────────────────────────────

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.eyebrow}>{children}</Text>
  );
}

export function ScreenTitle({
  children,
  size = Typography.screenTitle.fontSize,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  style?: object;
}) {
  return (
    <Text style={[styles.screenTitle, { fontSize: size }, style]}>{children}</Text>
  );
}

export function Sub({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.sub, style]}>{children}</Text>;
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost';

export function Btn({
  children,
  onPress,
  variant = 'primary',
  style: extraStyle,
  textColor,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: BtnVariant;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
}) {
  const containerStyle: StyleProp<ViewStyle>[] = [styles.btn];
  const textStyle: TextStyle[] = [styles.btnText];

  if (variant === 'secondary') {
    containerStyle.push(styles.btnSecondary);
    textStyle.push(styles.btnTextSecondary);
  } else if (variant === 'ghost') {
    containerStyle.push(styles.btnGhost);
    textStyle.push(styles.btnTextGhost);
  }

  if (extraStyle) containerStyle.push(extraStyle);
  if (textColor) textStyle.push({ color: textColor });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
}

export function BackBtn({
  onPress,
  dark = false,
}: {
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.backBtn, dark ? styles.backBtnDark : styles.backBtnLight]}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Text style={{ color: dark ? Colors.paper : Colors.navy, fontSize: 18, lineHeight: 20 }}>←</Text>
    </TouchableOpacity>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

export const inputStyle: TextStyle = {
  backgroundColor: Colors.navyPale,
  borderWidth: 1,
  borderColor: Colors.line,
  borderRadius: 10,
  paddingHorizontal: 13,
  paddingVertical: 12,
  fontFamily: Fonts.inter,
  fontSize: 13.5,
  color: Colors.ink,
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressTrack}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < current ? styles.progressFilled : styles.progressEmpty,
              i < total - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressLabel}>Step {current} of {total}</Text>
    </View>
  );
}

// ─── Verified stamp ───────────────────────────────────────────────────────────

export function Verified() {
  return (
    <View style={styles.stamp}>
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="3">
        <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.stampText}>ID + background verified</Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: 12 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

// ─── Star icon ────────────────────────────────────────────────────────────────

export function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z"
        fill={filled ? Colors.gold : Colors.line}
      />
    </Svg>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ dashed }: { dashed?: boolean }) {
  return (
    <View
      style={[
        styles.divider,
        dashed && styles.dividerDashed,
      ]}
    />
  );
}

// ─── Summary row ─────────────────────────────────────────────────────────────

export function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: TextStyle;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── Tab bar icons ────────────────────────────────────────────────────────────

export function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <Path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BookingsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </Svg>
  );
}

export function MessagesIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <Path
        d="M21 11.5a8.4 8.4 0 01-8.9 8.4 8.7 8.7 0 01-3-.5L3 21l1.7-4a8.4 8.4 0 01-.7-3.5A8.4 8.4 0 0112.9 5a8.5 8.5 0 018.1 6.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AccountIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
    </Svg>
  );
}

export function HeartIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={Colors.goldLight} strokeWidth="1.6">
      <Path d="M12 21s-7-4.6-9.5-9.1C.7 8.2 2.6 4.5 6.3 4c2.1-.3 4 .7 5.7 2.6C13.7 4.7 15.6 3.7 17.7 4c3.7.5 5.6 4.2 3.8 7.9C19 16.4 12 21 12 21z" />
    </Svg>
  );
}

export function CheckIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="1.6">
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={Colors.slate} strokeWidth="1.6">
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Safe Area Wrapper ────────────────────────────────────────────────────────

export function SafeAreaWrapper({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.gold,
  },
  screenTitle: {
    fontFamily: Fonts.interBold,
    color: Colors.navy,
    marginTop: 4,
    letterSpacing: -0.2,
    lineHeight: Typography.screenTitle.lineHeight,
  },
  sub: {
    color: Colors.slate,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Typography.btnLabel.fontFamily,
    fontSize: Typography.btnLabel.fontSize,
    lineHeight: Typography.btnLabel.lineHeight,
    color: Colors.goldLight,
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.navy,
  },
  btnTextSecondary: {
    color: Colors.navy,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderStyle: 'dashed',
  },
  btnTextGhost: {
    color: Colors.slate,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backBtnDark: {
    backgroundColor: Colors.navyOverlayLight,
  },
  backBtnLight: {
    backgroundColor: Colors.navyPale,
  },
  progressWrapper: {
    marginBottom: 20,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 3,
    height: 6,
  },
  progressFilled: { backgroundColor: Colors.navy },
  progressEmpty: { backgroundColor: Colors.navyTint },
  progressLabel: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.gold,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: Fonts.interBold,
    fontSize: 12,
    color: Colors.navy,
    marginBottom: 6,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    alignSelf: 'flex-start',
  },
  stampText: {
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.success,
  },
  avatar: {
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Fonts.interBold,
    fontWeight: '700',
    color: Colors.goldLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: 4,
  },
  dividerDashed: {
    backgroundColor: 'transparent',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    height: 0,
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    alignItems: 'flex-start',
  },
  rowLabel: {
    color: Colors.slate,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  rowValue: {
    color: Colors.navy,
    fontFamily: Fonts.interSemiBold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    flex: 1,
  },
  sectionLabel: {
    paddingTop: 16,
    paddingBottom: 8,
    fontFamily: Fonts.spaceMonoBold,
    fontSize: 12,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color: Colors.slateSoft,
  },
});
