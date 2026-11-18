import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

/**
 * variant: 'primary' (rosa) | 'light' (blanco) | 'outline' | 'ghost' | 'danger'
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  small = false,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.text} style={{ marginRight: 6 }} />}
          <Text style={[styles.text, small && styles.smallText, { color: v.text }]}>{title}</Text>
          {iconRight && (
            <Ionicons name={iconRight} size={small ? 16 : 18} color={v.text} style={{ marginLeft: 6 }} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  light: { bg: colors.white, border: colors.white, text: colors.navy },
  outline: { bg: 'transparent', border: colors.white, text: colors.white },
  outlineDark: { bg: 'transparent', border: colors.text, text: colors.text },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.primary },
  danger: { bg: colors.danger, border: colors.danger, text: colors.white },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 36, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '800' },
  smallText: { fontSize: 14 },
});
