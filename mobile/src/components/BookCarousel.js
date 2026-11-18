import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BookCover from './BookCover';
import Stars from './Stars';
import { authorName, ratingValue } from '../utils/helpers';
import { colors } from '../theme';

export function BookTile({ book, width = 108, onPress, showMeta = true }) {
  const navigation = useNavigation();
  const go = onPress || (() => navigation.push('Book', { id: book.id, preview: book }));
  return (
    <Pressable onPress={go} style={({ pressed }) => [{ width }, pressed && { opacity: 0.8 }]}>
      <BookCover book={book} width={width} />
      {showMeta && (
        <>
          <Text style={styles.title} numberOfLines={2}>
            {book.titulo}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {authorName(book)}
          </Text>
          {ratingValue(book) > 0 && <Stars value={ratingValue(book)} size={11} />}
        </>
      )}
    </Pressable>
  );
}

/** Fila horizontal de libros con título (carruseles de la página principal) */
export default function BookCarousel({ title, books = [], subtitle }) {
  if (!books.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <FlatList
        horizontal
        data={books}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={({ item }) => <BookTile book={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginHorizontal: 16, marginBottom: 10 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginHorizontal: 16, marginTop: -6, marginBottom: 10 },
  title: { marginTop: 8, fontSize: 13, fontWeight: '700', color: colors.text },
  author: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
});
