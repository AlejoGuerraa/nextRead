import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { GENEROS, splitTastes } from '../utils/helpers';

export { splitTastes };
import { colors, radius } from '../theme';

const toggleIn = (list, value, max) => {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
};

/** Selección de hasta `max` géneros favoritos (tarjetas pastel como el wireframe) */
export function GenrePicker({ value = [], onChange, max = 5, dark = true }) {
  return (
    <View>
      <Text style={[styles.counter, !dark && { color: colors.textMuted }]}>
        {value.length}/{max} seleccionados
      </Text>
      <View style={styles.grid}>
        {GENEROS.map((g, i) => {
          const selected = value.includes(g);
          const disabled = !selected && value.length >= max;
          return (
            <Pressable
              key={g}
              onPress={() => onChange(toggleIn(value, g, max))}
              style={[
                styles.genre,
                { backgroundColor: colors.pastels[i % colors.pastels.length] },
                selected && styles.genreSelected,
                disabled && { opacity: 0.45 },
              ]}
            >
              {selected && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{value.indexOf(g) + 1}</Text>
                </View>
              )}
              <Text style={styles.genreText} numberOfLines={2}>
                {g}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Selección de hasta `max` autores favoritos con foto + buscador */
export function AuthorPicker({ authors = [], value = [], onChange, max = 3, dark = true }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? authors.filter((a) => a.nombre.toLowerCase().includes(q)) : authors;
    return [...list].sort((a, b) => Number(value.includes(b.nombre)) - Number(value.includes(a.nombre)));
  }, [authors, query, value]);

  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar autor…"
          placeholderTextColor="#90A0B0"
          style={styles.searchInput}
        />
      </View>
      <Text style={[styles.counter, !dark && { color: colors.textMuted }]}>
        {value.length}/{max} seleccionados
      </Text>
      <View style={styles.authorGrid}>
        {filtered.map((a) => {
          const selected = value.includes(a.nombre);
          const disabled = !selected && value.length >= max;
          return (
            <Pressable
              key={a.id}
              onPress={() => onChange(toggleIn(value, a.nombre, max))}
              style={[styles.author, disabled && { opacity: 0.45 }]}
            >
              <View>
                <Avatar src={a.url_cara} name={a.nombre} size={66} style={selected ? styles.authorSelected : styles.authorIdle} />
                {selected && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                )}
              </View>
              <Text style={[styles.authorName, !dark && { color: colors.text }]} numberOfLines={2}>
                {a.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.whiteMuted, fontWeight: '700', marginBottom: 10, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  genre: {
    width: '31.5%',
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  genreSelected: { borderColor: colors.primary, backgroundColor: colors.sky },
  genreText: { color: colors.text, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.text },
  authorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  author: { width: '31%', alignItems: 'center' },
  authorIdle: { borderWidth: 3, borderColor: 'transparent' },
  authorSelected: { borderWidth: 3, borderColor: colors.primary },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  authorName: { color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 6 },
});
