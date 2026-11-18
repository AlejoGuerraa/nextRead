import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import ListCard from '../components/ListCard';
import Stars from '../components/Stars';
import { Loading, LoginRequired } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { authorName, customListsToArray, splitTastes, userBanner } from '../utils/helpers';
import { colors, radius } from '../theme';

// Colores del perfil de la web (pagescss/perfil.css)
const WEB = { primary: '#1A374D', secondary: '#406882', accent: '#6998AB', logout: '#8B3A3A' };

/** Perfil propio: misma estructura que /perfil en la compu */
export default function ProfileScreen({ navigation }) {
  const { isLogged, profile, user, refreshProfile, exitGuest, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isLogged) refreshProfile();
    }, [isLogged, refreshProfile])
  );

  const lists = useMemo(() => customListsToArray(profile?.listas), [profile]);

  if (!isLogged) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader />
        <LoginRequired onLogin={exitGuest} message="Iniciá sesión para ver tu perfil, tus libros y tus listas." />
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader />
        <Loading />
      </View>
    );
  }

  const leidos = profile.libros_leidos || [];
  const ratings = leidos.map((b) => Number(b.puntuacion_usuario)).filter((n) => n >= 1 && n <= 5);
  const ratingGeneral = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;
  const generoTop = Array.isArray(profile.genero_top_leyente) ? profile.genero_top_leyente[0] : profile.genero_top_leyente;
  const generos = splitTastes(profile.genero_preferido);
  const autores = splitTastes(profile.autor_preferido);
  const banner = userBanner(profile);

  const shelves = [
    { field: 'libros_leidos', title: 'Leídos', books: leidos },
    { field: 'libros_para_leer', title: 'Para leer', books: profile.libros_para_leer || [] },
    { field: 'libros_en_lectura', title: 'Seguir leyendo', books: profile.libros_en_lectura || [] },
    { field: 'libros_favoritos', title: 'Favoritos', books: profile.libros_favoritos || [] },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader
        right={
          <Pressable hitSlop={10} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* ---------- BANNER (como bannerPerfil.jsx) ---------- */}
        <View style={styles.banner}>
          {banner && !bannerFailed ? (
            <Image source={{ uri: banner }} style={StyleSheet.absoluteFill} onError={() => setBannerFailed(true)} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#406882' }]} />
          )}
          <View style={styles.bannerShade} />
          <View style={styles.bannerActions}>
            <Pressable style={[styles.bannerBtn, { backgroundColor: WEB.logout }]} onPress={confirmLogout}>
              <Text style={styles.bannerBtnText}>Desloguearse</Text>
            </Pressable>
            <Pressable style={[styles.bannerBtn, { backgroundColor: WEB.secondary }]} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.bannerBtnText}>Editar perfil</Text>
            </Pressable>
          </View>
          <View style={styles.avatarWrap}>
            <Avatar src={profile.iconoData?.simbolo || '/iconos/LogoDefault1.jpg'} name={profile.usuario} size={116} />
            <View style={styles.avatarRing} />
          </View>
        </View>

        <View style={styles.main}>
          {/* ---------- ACERCA DE MÍ (seccionAbout.jsx) ---------- */}
          <View style={styles.glass}>
            <Text style={styles.cardKicker}>Acerca de mí</Text>
            <Text style={styles.username}>@{profile.usuario || user?.usuario}</Text>
            <Text style={styles.fullName}>
              {profile.nombre} {profile.apellido}
            </Text>
            <Text style={styles.description}>{profile.descripcion || 'Todavía no escribiste una descripción.'}</Text>
          </View>

          {/* ---------- ACTIVIDAD (estadisticas.jsx) ---------- */}
          <View style={styles.glass}>
            <Text style={styles.cardKicker}>Actividad</Text>
            <Text style={styles.activity}>
              Leíste <Text style={styles.bold}>{leidos.length}</Text> libros
            </Text>
            <Text style={styles.activity}>
              Género más leído: <Text style={styles.bold}>{generoTop && generoTop !== 'No definido' ? generoTop : '—'}</Text>
            </Text>
            <Text style={styles.activity}>
              Rating general: <Text style={styles.bold}>{ratingGeneral ? `${ratingGeneral} / 5` : '—'}</Text>
            </Text>
          </View>

          {/* ---------- TARJETAS DE ESTADÍSTICAS ---------- */}
          <View style={styles.statsGrid}>
            <StatCard label="Libros leídos" value={leidos.length} />
            <StatCard label="Seguidores" value={profile.seguidores ?? 0} onPress={() => navigation.push('FollowList', { userId: profile.id, type: 'seguidores' })} />
            <StatCard label="Seguidos" value={profile.seguidos ?? 0} onPress={() => navigation.push('FollowList', { userId: profile.id, type: 'seguidos' })} />
            <StatCard label="Título preferido" value={profile.titulo_preferido || 'No definido'} small />
            <StatCard label="Géneros preferidos" chips={generos} wide />
            <StatCard label="Autores preferidos" chips={autores} wide />
          </View>

          {/* ---------- TUS LISTAS ---------- */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Tus listas</Text>
            <Pressable style={styles.smallBtn} onPress={() => navigation.push('Library')}>
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={styles.smallBtnText}>Crear lista</Text>
            </Pressable>
          </View>
          {lists.length === 0 ? (
            <View style={styles.emptyLists}>
              <Ionicons name="albums-outline" size={30} color={WEB.accent} />
              <Text style={styles.emptyTitle}>No tenés listas creadas</Text>
              <Text style={styles.emptyText}>Creá una lista para organizar tus próximas lecturas.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {lists.slice(0, 4).map((l) => (
                <ListCard key={l.nombre} list={l} onPress={() => navigation.push('ListDetail', { name: l.nombre })} />
              ))}
              {lists.length > 4 && (
                <Pressable onPress={() => navigation.push('Library')}>
                  <Text style={styles.more}>Ver todas ({lists.length})</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ---------- ESTANTERÍAS: Leídos / Para leer / Seguir leyendo / Favoritos ---------- */}
        {shelves.map((s) => (
          <View key={s.field} style={{ marginTop: 22 }}>
            <View style={[styles.sectionHead, { paddingHorizontal: 16 }]}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Pressable onPress={() => navigation.push('ListDetail', { shelf: s.field })} hitSlop={8}>
                <Text style={styles.listMeta}>
                  {s.books.length} libros <Ionicons name="chevron-forward" size={12} />
                </Text>
              </Pressable>
            </View>
            {s.books.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyRowText}>Podés agregar libros desde Inicio o Descubrir</Text>
              </View>
            ) : (
              <FlatList
                horizontal
                data={s.books}
                keyExtractor={(b) => `${s.field}-${b.id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 6 }}
                renderItem={({ item }) => (
                  <ProfileBookCard book={item} onPress={() => navigation.push('Book', { id: item.id, preview: item })} />
                )}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, onPress, small, chips, wide }) {
  return (
    <Pressable style={[styles.statCard, wide && { width: '100%' }]} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      {chips ? (
        chips.length ? (
          <View style={styles.chips}>
            {chips.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.statValue, styles.statSmall]}>No definido</Text>
        )
      ) : (
        <Text style={[styles.statValue, small && styles.statSmall]} numberOfLines={2}>
          {value}
        </Text>
      )}
      {onPress && <Ionicons name="chevron-forward" size={14} color={WEB.accent} style={styles.statChevron} />}
    </Pressable>
  );
}

/** Igual que .book-card de la web: portada, título, autor, TU puntuación y botón Ver */
function ProfileBookCard({ book, onPress }) {
  const r = Number(book.puntuacion_usuario);
  return (
    <View style={styles.bookCard}>
      <BookCover book={book} width={96} />
      <Text style={styles.bookTitle} numberOfLines={2}>
        {book.titulo}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {authorName(book)}
      </Text>
      <View style={styles.bookFooter}>
        {r ? <Stars value={r} size={11} /> : <Text style={styles.noRating}>—</Text>}
        <Pressable style={styles.verBtn} onPress={onPress}>
          <Text style={styles.verText}>Ver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7F9' },
  banner: { height: 170, justifyContent: 'flex-end', marginBottom: 64 },
  bannerShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  bannerActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  bannerBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  bannerBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  avatarWrap: { position: 'absolute', left: 18, bottom: -58, width: 124, height: 124, borderRadius: 62, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  avatarRing: { position: 'absolute', top: -9, left: -9, right: -9, bottom: -9, borderRadius: 80, borderWidth: 2, borderColor: 'rgba(255,255,255,0.72)' },
  main: { paddingHorizontal: 16, gap: 12 },
  glass: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 16, shadowColor: '#121821', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardKicker: { fontSize: 15, fontWeight: '800', color: WEB.primary, marginBottom: 6 },
  username: { color: WEB.secondary, fontWeight: '700' },
  fullName: { fontSize: 22, fontWeight: '900', color: WEB.primary, marginTop: 2 },
  description: { color: '#203040', marginTop: 8, lineHeight: 20 },
  activity: { color: '#203040', marginTop: 4, fontSize: 14 },
  bold: { fontWeight: '900', color: WEB.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  statCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 12, padding: 14, minHeight: 78, shadowColor: '#0C1218', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statLabel: { color: WEB.secondary, fontSize: 12, fontWeight: '700' },
  statValue: { color: WEB.primary, fontSize: 26, fontWeight: '900', marginTop: 6 },
  statSmall: { fontSize: 15 },
  statChevron: { position: 'absolute', right: 10, top: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#E7F0F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  chipText: { color: WEB.primary, fontWeight: '700', fontSize: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: WEB.primary },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WEB.secondary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  smallBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyLists: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyTitle: { fontWeight: '800', color: WEB.primary, marginTop: 8 },
  emptyText: { color: WEB.secondary, marginTop: 4, textAlign: 'center' },
  more: { color: WEB.secondary, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  listMeta: { color: WEB.secondary, fontWeight: '700', fontSize: 13 },
  emptyRow: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 10 },
  emptyRowText: { color: WEB.secondary, textAlign: 'center' },
  bookCard: { width: 128, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', shadowColor: '#0A141E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  bookTitle: { fontWeight: '800', color: WEB.primary, fontSize: 13, marginTop: 8, textAlign: 'center', minHeight: 34 },
  bookAuthor: { color: WEB.secondary, fontSize: 11, textAlign: 'center' },
  bookFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 8 },
  noRating: { color: WEB.accent },
  verBtn: { backgroundColor: WEB.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  verText: { color: colors.white, fontWeight: '800', fontSize: 12 },
});
