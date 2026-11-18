import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

/** Pestañas tipo "chips" horizontales */
export default function Segmented({ options, value, onChange, style, dark = false }) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, dark && styles.darkChip, active && (dark ? styles.darkActive : styles.active)]}>
            <Text style={[styles.text, dark && styles.darkText, active && styles.activeText]}>
              {o.label}
              {typeof o.count === 'number' ? ` (${o.count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card },
  active: { backgroundColor: colors.header },
  text: { color: colors.text, fontWeight: '700', fontSize: 13 },
  activeText: { color: colors.white },
  darkChip: { backgroundColor: 'rgba(255,255,255,0.1)' },
  darkActive: { backgroundColor: colors.primaryLight },
  darkText: { color: colors.whiteMuted },
});
