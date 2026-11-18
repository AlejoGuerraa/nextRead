import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookCover, pastelFor } from '../utils/helpers';
import { colors, radius } from '../theme';

/** Portada con fallback pastel (como los rectángulos del wireframe) */
export default function BookCover({ book, width = 110, style }) {
  const [failed, setFailed] = useState(false);
  const uri = bookCover(book);
  const height = Math.round(width * 1.5);

  return (
    <View style={[styles.wrap, { width, height, backgroundColor: pastelFor(book?.id) }, style]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.img} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <View style={styles.fallback}>
          <Ionicons name="book-outline" size={width / 4} color={colors.textMuted} />
          <Text style={styles.fallbackText} numberOfLines={3}>
            {book?.titulo || ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0A1159',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  img: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  fallbackText: { marginTop: 6, fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '600' },
});
