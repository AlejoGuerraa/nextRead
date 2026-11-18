import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import BookCover from '../components/BookCover';
import BookCarousel from '../components/BookCarousel';
import AuthorCarousel from '../components/AuthorCarousel';
import Segmented from '../components/Segmented';
import Stars from '../components/Stars';
import { Loading, ErrorState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { booksApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { authorName, ratingValue } from '../utils/helpers';
import { buildExploreCarousels, buildLocalCarousels, getCatalog, interactedIds, onePerSeries } from '../utils/catalog';
import { colors, radius } from '../theme';

const decadeTitle = (decade) => {
  const raw = String(decade ?? '').replace(/s$/, '');
  return /^\d{4}$/.test(raw) ? `Libros de los ${raw.slice(2)}` : `Libros de los ${raw}`;
};

const asCarousels = (list = []) =>
  list.map((c) => ({ id: c.id, title: c.title, kind: c.kind, books: c.libros || [], authors: c.autores || [] }));

const hasContent = (c) => (c.books?.length || 0) > 0 || (c.authors?.length || 0) > 0;

export default function HomeScreen({ navigation }) {
  const { user, profile, isLogged } = useAuth();
  const [tab, setTab] = useState(isLogged ? 'paraVos' : 'explorar');
  const [data, setData] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const tasks = {
      catalog: getCatalog(),
      global: booksApi.globalCarousels(),
      decades: booksApi.byDecade(),
    };
    if (isLogged) {
      tasks.personalized = booksApi.personalizedCarousels();
      tasks.contextual = booksApi.contextualCarousels();
    }
    const keys = Object.keys(tasks);
    const results = await Promise.allSettled(Object.values(tasks));
    const r = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
    const ok = (k) => (r[k]?.status === 'fulfilled' ? r[k].value : null);

    if (results.every((x) => x.status === 'rejected')) {
      setData({ loading: false, error: getErrorMessage(r.global.reason) });
      return;
    }
    setData({
      loading: false,
      error: null,
      catalog: ok('catalog'),
      global: asCarousels(ok('global')?.carousels),
      personalized: ok('personalized')?.status === 'ready' ? asCarousels(ok('personalized').carousels) : [],
      contextual: asCarousels(ok('contextual')?.carousels),
      decades: (ok('decades')?.decades || []).slice(0, 6).map((g, i) => ({
        id: `decada-${g.decade ?? i}`,
        title: decadeTitle(g.decade),
        books: onePerSeries(g.libros || []),
      })),
    });
  }, [isLogged]);

  useEffect(() => {
    load();
  }, [load]);

  // "Porque leíste X": libros parecidos a tus lecturas mejor puntuadas (4-5 ★)
  const [similar, setSimilar] = useState([]);
  useEffect(() => {
    if (!isLogged || !profile) return;
    const topRead = (profile.libros_leidos || [])
      .filter((b) => Number(b.puntuacion_usuario) >= 4)
      .sort((a, b) => Number(b.puntuacion_usuario) - Number(a.puntuacion_usuario))
      .slice(0, 2);
    if (!topRead.length) return;
    const seen = interactedIds(profile);
    Promise.allSettled(topRead.map((b) => booksApi.similar(user.id, b.id))).then((res) => {
      setSimilar(
        res
          .map((x, i) =>
            x.status === 'fulfilled'
              ? {
                  id: `similar-${topRead[i].id}`,
                  title: `Porque leíste ${topRead[i].titulo}`,
                  books: onePerSeries((x.value?.libros || []).filter((b) => !seen.has(Number(b.id)))),
                }
              : null
          )
          .filter((c) => c && c.books.length >= 2)
      );
    });
  }, [isLogged, profile, user?.id]);

  const sections = useMemo(() => {
    if (data.loading || data.error) return [];
    const catalog = data.catalog;
    const explore = catalog ? buildExploreCarousels(catalog, profile) : [];
    if (tab === 'paraVos') {
      const local = catalog ? buildLocalCarousels(catalog, profile) : [];
      const reading = profile?.libros_en_lectura?.length
        ? [{ id: 'leyendo', title: 'Seguí leyendo', books: profile.libros_en_lectura }]
        : [];
      return [...reading, ...data.personalized, ...local, ...similar, ...data.contextual].filter(hasContent);
    }
    if (tab === 'tendencias') {
      return [...data.global, explore.find((c) => c.id === 'mejor-valorados')].filter(Boolean).filter(hasContent);
    }
    return [...explore.filter((c) => c.id !== 'mejor-valorados'), ...data.decades].filter(hasContent);
  }, [data, tab, profile, similar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getCatalog(true).catch(() => {});
    await load();
    setRefreshing(false);
  };

  const featured = sections.find((c) => c.books?.length)?.books?.[0];
  const tabs = [
    ...(isLogged ? [{ key: 'paraVos', label: 'Para vos' }] : []),
    { key: 'tendencias', label: 'Tendencias' },
    { key: 'explorar', label: 'Explorar' },
  ];

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader
        right={
          <Pressable hitSlop={10} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={22} color={colors.white} />
          </Pressable>
        }
      />
      <View style={styles.tabsBar}>
        <Segmented options={tabs} value={tab} onChange={setTab} dark />
      </View>

      {data.loading ? (
        <Loading label="Buscando libros para vos…" />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={load} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {tab === 'paraVos' && (
            <>
              <Text style={styles.greeting}>¡Hola, {user?.nombre || user?.usuario}!</Text>
              <Text style={styles.greetingSub}>Elegimos estos libros pensando en vos</Text>
            </>
          )}

          {featured && (
            <Pressable style={styles.hero} onPress={() => navigation.push('Book', { id: featured.id, preview: featured })}>
              <BookCover book={featured} width={104} />
              <View style={styles.heroInfo}>
                <Text style={styles.heroKicker}>{tab === 'tendencias' ? 'EN TENDENCIA' : 'DESTACADO'}</Text>
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {featured.titulo}
                </Text>
                <Text style={styles.heroAuthor}>{authorName(featured)}</Text>
                {ratingValue(featured) > 0 && <Stars value={ratingValue(featured)} size={14} />}
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>Ver libro</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.white} />
                </View>
              </View>
            </Pressable>
          )}

          {sections.map((c) =>
            c.kind === 'authors' ? (
              <AuthorCarousel key={c.id} title={c.title} authors={c.authors} />
            ) : (
              <BookCarousel key={c.id} title={c.title} subtitle={c.subtitle} books={c.books} />
            )
          )}

          {tab === 'paraVos' && sections.length === 0 && (
            <View style={styles.notice}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
              <Text style={styles.noticeText}>
                Marcá algunos libros como leídos o favoritos (probá la pestaña Descubrir) y acá vas a ver recomendaciones para vos.
              </Text>
            </View>
          )}

          {!isLogged && (
            <View style={styles.notice}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text style={styles.noticeText}>Creá una cuenta para recibir recomendaciones hechas para vos.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabsBar: { backgroundColor: colors.header, paddingBottom: 10 },
  greeting: { fontSize: 24, fontWeight: '900', color: colors.text, marginHorizontal: 16, marginTop: 18 },
  greetingSub: { fontSize: 14, color: colors.textMuted, marginHorizontal: 16, marginTop: 2 },
  hero: { flexDirection: 'row', backgroundColor: colors.panel, margin: 16, marginBottom: 0, padding: 16, borderRadius: radius.lg },
  heroInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  heroKicker: { color: colors.rose, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: 4 },
  heroAuthor: { color: colors.whiteMuted, marginVertical: 4 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, marginTop: 10 },
  heroBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, marginHorizontal: 16, marginTop: 18, padding: 14, borderRadius: radius.md },
  noticeText: { flex: 1, color: colors.text, fontSize: 13 },
});
