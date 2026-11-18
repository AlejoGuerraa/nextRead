import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/** Estrellas. Con `onChange` son interactivas (1-5). */
export default function Stars({ value = 0, size = 16, onChange, color = colors.star, emptyColor = '#C6D3DE', style }) {
  return (
    <View style={[styles.row, style]}>
      {[1, 2, 3, 4, 5].map((n) => {
        const name = value >= n ? 'star' : value >= n - 0.5 ? 'star-half' : 'star-outline';
        const icon = <Ionicons name={name} size={size} color={value >= n - 0.5 ? color : emptyColor} />;
        return onChange ? (
          <Pressable key={n} hitSlop={6} onPress={() => onChange(n)} style={{ paddingHorizontal: 3 }}>
            {icon}
          </Pressable>
        ) : (
          <View key={n} style={{ marginRight: 1 }}>
            {icon}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
