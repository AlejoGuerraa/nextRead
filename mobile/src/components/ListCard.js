import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookCover from './BookCover';
import { colors, radius } from '../theme';

/** Tarjeta de lista con hasta 3 portadas apiladas */
export default function ListCard({ list, onPress }) {
  const books = (list.libros || []).filter((b) => b && typeof b === 'object');
  const count = list.totalLibros ?? list.libros?.length ?? 0;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.covers}>
        {books.length === 0 ? (
          <View style={styles.emptyCover}>
            <Ionicons name="albums-outline" size={26} color={colors.textMuted} />
          </View>
        ) : (
          books.slice(0, 3).map((b, i) => (
            <BookCover key={b.id} book={b} width={46} style={{ position: 'absolute', left: i * 22, top: i * 3, zIndex: 3 - i }} />
          ))
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name} numberOfLines={1}>
          {list.nombre}
        </Text>
        <Text style={styles.count}>
          {count} {count === 1 ? 'libro' : 'libros'}
          {list.isPrivate ? '  ·  🔒 Privada' : ''}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
  covers: { width: 96, height: 76 },
  emptyCover: { width: 52, height: 76, borderRadius: 8, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  count: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
});
