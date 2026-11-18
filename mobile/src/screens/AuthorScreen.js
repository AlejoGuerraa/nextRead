import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import Avatar from '../components/Avatar';
import BookGrid from '../components/BookGrid';
import Button from '../components/Button';
import { Loading, ErrorState } from '../components/StateViews';
import { catalogApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { colors } from '../theme';

export default function AuthorScreen({ route }) {
  const { id, name } = route.params;
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await catalogApi.autor(id, { limit: 21, page: 1 });
      setAuthor(res.autor);
      setBooks((res.libros || []).map((b) => ({ ...b, Autor: res.autor })));
      setNextPage(res.nextPage);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!nextPage) return;
    setLoadingMore(true);
    try {
      const res = await catalogApi.autor(id, { limit: 21, page: nextPage });
      setBooks((b) => [...b, ...(res.libros || []).map((x) => ({ ...x, Autor: res.autor }))]);
      setNextPage(res.nextPage);
    } catch {
      // ignorar
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title={author?.nombre || name || 'Autor'} />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.hero}>
            <Avatar src={author?.url_cara} name={author?.nombre} size={110} border />
            <Text style={styles.name}>{author?.nombre}</Text>
            <Text style={styles.count}>{books.length}{nextPage ? '+' : ''} libros en NextRead</Text>
          </View>
          <Text style={styles.section}>Obras</Text>
          <BookGrid books={books} />
          {nextPage && (
            <Button title="Ver más" variant="outlineDark" small onPress={loadMore} loading={loadingMore} style={{ margin: 20 }} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', backgroundColor: colors.panel, paddingVertical: 26 },
  name: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 12 },
  count: { color: colors.whiteMuted, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, margin: 16 },
});
