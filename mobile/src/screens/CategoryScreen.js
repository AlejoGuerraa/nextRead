import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import { BookTile } from '../components/BookCarousel';
import Segmented from '../components/Segmented';
import { Loading, ErrorState, EmptyState } from '../components/StateViews';
import { getErrorMessage } from '../api/client';
import { byRanking, CATEGORIES, getCatalog, isManga, matchesGenre, onePerSeries } from '../utils/catalog';
import { colors } from '../theme';

const SORTS = [
  { key: 'ranking', label: 'Mejor valorados' },
  { key: 'az', label: 'A-Z' },
  { key: 'za', label: 'Z-A' },
  { key: 'nuevos', label: 'Más nuevos' },
  { key: 'viejos', label: 'Más antiguos' },
];

const SORTERS = {
  ranking: (a, b) => byRanking(a, b) || a.titulo.localeCompare(b.titulo, 'es'),
  az: (a, b) => a.titulo.localeCompare(b.titulo, 'es', { numeric: true }),
  za: (a, b) => b.titulo.localeCompare(a.titulo, 'es', { numeric: true }),
  nuevos: (a, b) => Number(b.anio) - Number(a.anio) || a.titulo.localeCompare(b.titulo, 'es', { numeric: true }),
  viejos: (a, b) => Number(a.anio) - Number(b.anio) || a.titulo.localeCompare(b.titulo, 'es', { numeric: true }),
};

const COLUMNS = 3;
const GAP = 14;

/** Libros de una categoría o un género (desde Búsqueda), con orden y filtro de series */
export default function CategoryScreen({ route }) {
  const { category, genre, title } = route.params;
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 32 - GAP * (COLUMNS - 1)) / COLUMNS);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('ranking');
  const [series, setSeries] = useState('una');

  const load = useCallback(() => {
    setError(null);
    getCatalog().then(setCatalog).catch((e) => setError(getErrorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const base = useMemo(() => {
    if (!catalog) return [];
    const cat = CATEGORIES.find((c) => c.key === category);
    return catalog.books.filter((b) => (cat ? cat.filter(b) : genre ? matchesGenre(b, genre) : true));
  }, [catalog, category, genre]);

  const hasSeries = useMemo(() => base.some(isManga), [base]);

  const books = useMemo(() => {
    let list = base;
    if (series === 'una') {
      // primero el tomo más bajo de cada serie
      list = onePerSeries([...list].sort((a, b) => a._serie.tomo - b._serie.tomo));
    }
    return [...list].sort(SORTERS[sort]);
  }, [base, series, sort]);

  const header = (
    <View>
      <Text style={styles.label}>Ordenar por</Text>
      <Segmented options={SORTS} value={sort} onChange={setSort} />
      {hasSeries && (
        <>
          <Text style={styles.label}>Mangas</Text>
          <Segmented
            options={[
              { key: 'una', label: 'Un tomo por serie' },
              { key: 'todos', label: 'Todos los tomos' },
            ]}
            value={series}
            onChange={setSeries}
          />
        </>
      )}
      <Text style={styles.count}>{books.length} libros</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title={title} />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !catalog ? (
        <Loading />
      ) : (
        <FlatList
          data={books}
          extraData={sort + series}
          keyExtractor={(b) => String(b.id)}
          numColumns={COLUMNS}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="Sin libros" message="No hay libros en esta categoría todavía." />}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
          initialNumToRender={12}
          windowSize={7}
          renderItem={({ item }) => <BookTile book={item} width={tileWidth} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, fontWeight: '800', fontSize: 12, marginHorizontal: 16, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  count: { color: colors.textMuted, fontWeight: '700', marginHorizontal: 16, marginTop: 12 },
});
