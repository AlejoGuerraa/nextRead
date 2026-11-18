import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import BookCover from '../components/BookCover';
import Avatar from '../components/Avatar';
import Segmented from '../components/Segmented';
import { EmptyState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { authorName, GENEROS } from '../utils/helpers';
import { CATEGORIES, getCatalog, norm } from '../utils/catalog';
import { colors, radius } from '../theme';

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('libros');
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    getCatalog().then(setCatalog).catch((e) => setCatalogError(getErrorMessage(e)));
  }, []);

  // Libros y autores: se buscan en el catálogo (título, autor, género o tag)
  const q = norm(query);
  const bookResults = useMemo(() => {
    if (!catalog || !q) return { books: [], authors: [] };
    const authors = catalog.authors.filter((a) => norm(a.nombre).includes(q)).slice(0, 5);
    const scored = catalog.books
      .map((b) => {
        const t = norm(b.titulo);
        let score = 0;
        if (t.startsWith(q)) score = 4;
        else if (t.includes(q)) score = 3;
        else if (norm(b.Autor?.nombre).includes(q)) score = 2;
        else if ([...b._keys].some((k) => k.includes(q))) score = 1;
        return { b, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.b.ranking) - Number(a.b.ranking))
      .slice(0, 40)
      .map((x) => x.b);
    return { books: scored, authors };
  }, [catalog, q]);

  // Lectores: se buscan en la API (con debounce)
  useEffect(() => {
    if (mode !== 'usuarios') return undefined;
    clearTimeout(timer.current);
    const term = query.trim();
    if (!term) {
      setUsers([]);
      return undefined;
    }
    timer.current = setTimeout(async () => {
      setLoadingUsers(true);
      setUserError(null);
      try {
        const res = await usersApi.search(term);
        setUsers((res?.results || []).filter((u) => Number(u.id) !== Number(user?.id)));
      } catch (e) {
        setUserError(getErrorMessage(e));
      } finally {
        setLoadingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query, mode, user?.id]);

  const openCategory = (params) => navigation.push('Category', params);

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader />
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={mode === 'libros' ? 'Título, autor o género…' : 'Buscar lectores…'}
          placeholderTextColor="#90A0B0"
          style={styles.input}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {loadingUsers ? (
          <ActivityIndicator color={colors.primary} />
        ) : query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <Segmented
        options={[
          { key: 'libros', label: 'Libros y autores' },
          { key: 'usuarios', label: 'Lectores' },
        ]}
        value={mode}
        onChange={setMode}
        style={{ marginBottom: 6 }}
      />

      {mode === 'libros' && !q ? (
        // ---------- CATEGORÍAS (como el wireframe) ----------
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {catalogError ? <Text style={styles.errorText}>{catalogError}</Text> : null}
          <Text style={styles.sectionTitle}>Categorías</Text>
          {CATEGORIES.map((c) => {
            const count = catalog ? catalog.books.filter(c.filter).length : null;
            return (
              <Pressable key={c.key} style={styles.catRow} onPress={() => openCategory({ category: c.key, title: c.title })}>
                <View style={[styles.catIcon, { backgroundColor: c.color }]}>
                  <Ionicons name={c.icon} size={20} color={colors.white} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.catTitle}>{c.title}</Text>
                  {count != null && <Text style={styles.catCount}>{count} libros</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            );
          })}

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Géneros</Text>
          <View style={styles.chips}>
            {GENEROS.map((g, i) => (
              <Pressable
                key={g}
                style={[styles.chip, { backgroundColor: colors.pastels[i % colors.pastels.length] }]}
                onPress={() => openCategory({ genre: g, title: g })}
              >
                <Text style={styles.chipText}>{g}</Text>
              </Pressable>
            ))}
          </View>

          {catalog?.authors?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Autores</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {catalog.authors.map((a) => (
                  <Pressable key={a.id} style={styles.author} onPress={() => navigation.push('Author', { id: a.id, name: a.nombre })}>
                    <Avatar src={a.url_cara} name={a.nombre} size={64} />
                    <Text style={styles.authorName} numberOfLines={2}>
                      {a.nombre}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>
      ) : mode === 'libros' ? (
        // ---------- RESULTADOS DE LIBROS ----------
        !catalog ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : bookResults.books.length === 0 && bookResults.authors.length === 0 ? (
          <EmptyState icon="search-outline" title="Sin resultados" message={`No encontramos nada para "${query.trim()}"`} />
        ) : (
          <FlatList
            data={bookResults.books}
            keyExtractor={(b) => String(b.id)}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <>
                {bookResults.authors.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Autores</Text>
                    {bookResults.authors.map((a) => (
                      <Row
                        key={a.id}
                        left={<Avatar src={a.url_cara} name={a.nombre} size={48} />}
                        title={a.nombre}
                        subtitle="Ver todos sus libros"
                        onPress={() => navigation.push('Author', { id: a.id, name: a.nombre })}
                      />
                    ))}
                  </>
                )}
                {bookResults.books.length > 0 && <Text style={styles.sectionTitle}>Libros</Text>}
              </>
            }
            renderItem={({ item }) => (
              <Row
                left={<BookCover book={item} width={44} />}
                title={item.titulo}
                subtitle={`${authorName(item)}${item.anio ? ` · ${item.anio}` : ''} · ${item.tipo}`}
                onPress={() => navigation.push('Book', { id: item.id, preview: item })}
              />
            )}
          />
        )
      ) : (
        // ---------- LECTORES ----------
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            userError ? (
              <EmptyState icon="cloud-offline-outline" title="Error al buscar" message={userError} />
            ) : query.trim() && !loadingUsers ? (
              <EmptyState icon="people-outline" title="Sin resultados" message={`No hay lectores que coincidan con "${query.trim()}"`} />
            ) : (
              <EmptyState icon="people-outline" title="Encontrá lectores" message="Buscá por nombre o usuario para seguir a otras personas." />
            )
          }
          renderItem={({ item }) => (
            <Row
              left={<Avatar src={item.iconoData?.simbolo} name={item.usuario} size={48} />}
              title={`${item.nombre} ${item.apellido}`}
              subtitle={`@${item.usuario} · ${item.librosLeidos || 0} leídos · ${item.seguidores || 0} seguidores`}
              onPress={() => navigation.push('UserProfile', { username: item.usuario, id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

function Row({ left, title, subtitle, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      {left}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 16, marginBottom: 10, paddingHorizontal: 14, borderRadius: radius.pill, height: 48, gap: 8 },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 6 },
  errorText: { color: colors.danger, marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  catCount: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  author: { width: 76, alignItems: 'center' },
  authorName: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 10, marginBottom: 10 },
  rowTitle: { fontWeight: '800', color: colors.text },
  rowSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});
