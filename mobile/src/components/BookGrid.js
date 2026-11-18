import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BookTile } from './BookCarousel';
import Stars from './Stars';
import { colors } from '../theme';

/** Grilla de 3 columnas (no scrollea sola: se usa dentro de ScrollViews) */
export default function BookGrid({ books = [], emptyText = 'No hay libros acá todavía.', showUserRating = false }) {
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 32 - 2 * 14) / 3);

  if (!books.length) return <Text style={styles.empty}>{emptyText}</Text>;

  return (
    <View style={styles.grid}>
      {books.map((b) => (
        <View key={String(b.id)} style={{ width: tileWidth }}>
          <BookTile book={b} width={tileWidth} />
          {showUserRating && b.puntuacion_usuario ? (
            <View style={styles.userRating}>
              <Text style={styles.userRatingLabel}>Tu nota</Text>
              <Stars value={Number(b.puntuacion_usuario)} size={10} color={colors.primary} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 16 },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 30, paddingHorizontal: 20 },
  userRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userRatingLabel: { fontSize: 10, color: colors.primary, fontWeight: '700' },
});
