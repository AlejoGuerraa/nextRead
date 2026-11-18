import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import BookCover from '../components/BookCover';
import Stars from '../components/Stars';
import { Loading, ErrorState, EmptyState, LoginRequired } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { booksApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { authorName, ratingValue } from '../utils/helpers';
import { getCatalog, interactedIds, matchesGenre, norm, onePerSeries, userTastes } from '../utils/catalog';
import { colors, radius } from '../theme';

const SWIPE_THRESHOLD = 110;
const DOUBLE_TAP_MS = 280;

/**
 * "Descubrir": mazo de libros con los que todavía no interactuaste.
 *  - Deslizar a la derecha  → Leído
 *  - Deslizar a la izquierda → Quiero leer (Para leer)
 *  - Doble toque            → Favorito
 *  - Botón +                → Añadir a una lista
 */
export default function DiscoverScreen({ navigation }) {
  const { isLogged, profile, refreshProfile, exitGuest } = useAuth();
  const toast = useToast();
  const { width: screenW } = useWindowDimensions();

  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]); // para deshacer
  const [favorites, setFavorites] = useState(new Set());
  const [stats, setStats] = useState({ leido: 0, paraLeer: 0, favoritos: 0 });
  const [deckSize, setDeckSize] = useState({ width: 0, height: 0 });
  const handled = useRef(new Set()); // libros ya pasados en esta sesión

  const load = useCallback(() => {
    setError(null);
    getCatalog().then(setCatalog).catch((e) => setError(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  // Arma el mazo: libros sin interacción, un tomo por serie, priorizando tus gustos
  const buildDeck = useCallback(() => {
    if (!catalog || !profile) return;
    const seen = interactedIds(profile);
    const tastes = userTastes(profile, catalog);
    const candidates = catalog.books.filter((b) => !seen.has(Number(b.id)) && !handled.current.has(Number(b.id)));
    const scored = candidates.map((b) => {
      const genreHits = tastes.genres.filter((g) => matchesGenre(b, g)).length;
      const authorHit = tastes.authors.some((a) => norm(a) === norm(b.Autor?.nombre)) ? 1.5 : 0;
      return { b, score: genreHits + authorHit + Number(b.ranking || 0) / 5 + Math.random() * 1.2 };
    });
    const ordered = scored
      .sort((a, b) => b.score - a.score || a.b._serie.tomo - b.b._serie.tomo)
      .map((x) => x.b);
    // un tomo por serie: el de número más bajo que no hayas visto
    const firstVolumes = onePerSeries([...ordered].sort((a, b) => a._serie.tomo - b._serie.tomo));
    const keep = new Set(firstVolumes.map((b) => b.id));
    setDeck(ordered.filter((b) => keep.has(b.id)));
    setIndex(0);
  }, [catalog, profile]);

  useEffect(() => {
    if (deck.length === 0) buildDeck();
  }, [buildDeck, deck.length]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // al salir de la pestaña actualizamos el perfil una sola vez
        if (isLogged) refreshProfile();
      };
    }, [isLogged, refreshProfile])
  );

  const current = deck[index];
  const nextBook = deck[index + 1];

  // ---------- animaciones ----------
  const position = useRef(new Animated.ValueXY()).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const rotate = position.x.interpolate({ inputRange: [-screenW, 0, screenW], outputRange: ['-18deg', '0deg', '18deg'] });
  const readOpacity = position.x.interpolate({ inputRange: [20, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const laterOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({ inputRange: [-screenW, 0, screenW], outputRange: [1, 0.93, 1], extrapolate: 'clamp' });

  const doShelf = useCallback(
    async (tipo, book) => {
      try {
        await booksApi.addToShelf(tipo, book.id);
        return true;
      } catch (e) {
        const msg =
          e?.response?.status === 429
            ? 'Vas muy rápido 😅 Esperá unos minutos y seguí.'
            : getErrorMessage(e, 'No se pudo guardar el libro');
        toast.show(msg, 'error');
        return false;
      }
    },
    [toast]
  );

  const advance = useCallback(
    (action, book) => {
      handled.current.add(Number(book.id));
      setHistory((h) => [...h.slice(-19), { action, book }]);
      setIndex((i) => i + 1);
      // reseteamos la posición después de montar la carta nueva (evita un parpadeo)
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    },
    [position]
  );

  const swipe = useCallback(
    (direction) => {
      const book = deck[index];
      if (!book) return;
      const tipo = direction === 'right' ? 'leido' : direction === 'left' ? 'paraLeer' : null;
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? screenW * 1.5 : direction === 'left' ? -screenW * 1.5 : 0, y: direction === 'skip' ? 1000 : 40 },
        duration: 230,
        useNativeDriver: false,
      }).start(() => advance(tipo || 'skip', book));
      if (tipo) {
        doShelf(tipo, book).then((ok) => {
          if (ok) setStats((s) => ({ ...s, [tipo]: s[tipo] + 1 }));
        });
      }
    },
    [deck, index, position, screenW, advance, doShelf]
  );

  const favorite = useCallback(async () => {
    const book = deck[index];
    if (!book) return;
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 250, delay: 350, useNativeDriver: true }),
    ]).start();
    if (favorites.has(book.id)) return;
    setFavorites((f) => new Set(f).add(book.id));
    const ok = await doShelf('favoritos', book);
    if (ok) {
      setStats((s) => ({ ...s, favoritos: s.favoritos + 1 }));
      toast.show(`"${book.titulo}" agregado a favoritos ❤️`);
    }
  }, [deck, index, favorites, doShelf, heartScale, toast]);

  const undo = async () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    handled.current.delete(Number(last.book.id));
    setIndex((i) => Math.max(0, i - 1));
    position.setValue({ x: 0, y: 0 });
    if (last.action === 'leido' || last.action === 'paraLeer') {
      try {
        await booksApi.removeFromShelf(last.action, last.book.id);
        setStats((s) => ({ ...s, [last.action]: Math.max(0, s[last.action] - 1) }));
      } catch {
        // si falla, no pasa nada grave
      }
    }
  };

  // refs para que el PanResponder siempre use las funciones actuales
  const swipeRef = useRef(swipe);
  const favRef = useRef(favorite);
  swipeRef.current = swipe;
  favRef.current = favorite;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy > 0 ? g.dy * 0.7 : g.dy * 0.2 }),
        onPanResponderRelease: (_, g) => {
          const isTap = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
          if (isTap) {
            const now = Date.now();
            if (now - lastTap.current < DOUBLE_TAP_MS) {
              lastTap.current = 0;
              favRef.current();
            } else {
              lastTap.current = now;
            }
            return;
          }
          if (g.dy > SWIPE_THRESHOLD && Math.abs(g.dy) > Math.abs(g.dx)) swipeRef.current('skip');
          else if (g.dx > SWIPE_THRESHOLD || g.vx > 1.2) swipeRef.current('right');
          else if (g.dx < -SWIPE_THRESHOLD || g.vx < -1.2) swipeRef.current('left');
          else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start(),
      }),
    [position]
  );

  // ---------- render ----------
  if (!isLogged) {
    return (
      <View style={styles.container}>
        <AppHeader title="Descubrir" />
        <LoginRequired onLogin={exitGuest} message="Iniciá sesión para descubrir libros deslizando, como en Letterboxd." />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Descubrir" />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }
  if (!catalog || !profile) {
    return (
      <View style={styles.container}>
        <AppHeader title="Descubrir" />
        <Loading dark label="Armando tu mazo de libros…" />
      </View>
    );
  }

  // tamaño de la portada según el espacio disponible
  const coverW = Math.max(140, Math.min(deckSize.width * 0.72, (deckSize.height - 120) / 1.5, 360));
  // centramos la carta en el espacio libre (antes quedaba un hueco abajo)
  const cardTop = Math.max(0, (deckSize.height - (coverW * 1.5 + 100)) / 2);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Descubrir"
        right={
          <Pressable hitSlop={10} onPress={undo} disabled={!history.length}>
            <Ionicons name="arrow-undo" size={22} color={history.length ? colors.white : 'rgba(255,255,255,0.3)'} />
          </Pressable>
        }
      />

      <View style={styles.statsRow}>
        <Stat icon="bookmark" color={colors.success} value={stats.leido} label="leídos" />
        <Stat icon="time" color="#8FB8CE" value={stats.paraLeer} label="quiero leer" />
        <Stat icon="heart" color={colors.rose} value={stats.favoritos} label="favoritos" />
      </View>

      <View style={styles.deck} onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setDeckSize({ width, height });
        }}>
        {!current ? (
          <EmptyState
            dark
            icon="checkmark-done-circle-outline"
            title="¡Pasaste todos los libros!"
            message="No quedan libros con los que no hayas interactuado. Volvé cuando sumemos más."
            action="Volver a armar el mazo"
            onAction={() => {
              handled.current.clear();
              buildDeck();
            }}
          />
        ) : deckSize.width > 0 ? (
          <>
            {nextBook && (
              <Animated.View
                pointerEvents="none"
                style={[styles.card, styles.cardBehind, { top: cardTop, transform: [{ translateY: -14 }, { scale: nextScale }] }]}
              >
                <CardContent book={nextBook} coverW={coverW} coverOnly />
              </Animated.View>
            )}
            <Animated.View
              key={current.id}
              {...pan.panHandlers}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`${current.titulo}, de ${authorName(current)}`}
              accessibilityHint="Deslizá a la derecha si lo leíste, a la izquierda si querés leerlo, o tocá dos veces para favoritos"
              accessibilityActions={[
                { name: 'leido', label: 'Marcar como leído' },
                { name: 'paraLeer', label: 'Quiero leerlo' },
                { name: 'favorito', label: 'Agregar a favoritos' },
                { name: 'saltar', label: 'Saltar' },
              ]}
              onAccessibilityAction={(e) => {
                const a = e.nativeEvent.actionName;
                if (a === 'leido') swipe('right');
                else if (a === 'paraLeer') swipe('left');
                else if (a === 'favorito') favorite();
                else if (a === 'saltar') swipe('skip');
              }}
              style={[styles.card, { top: cardTop, transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
            >
              <CardContent book={current} coverW={coverW} isFavorite={favorites.has(current.id)} />

              <Animated.View style={[styles.stamp, styles.stampRead, { opacity: readOpacity }]}>
                <Text style={[styles.stampText, { color: colors.success }]}>LEÍDO</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.stampLater, { opacity: laterOpacity }]}>
                <Text style={[styles.stampText, { color: '#8FB8CE' }]}>QUIERO LEER</Text>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.bigHeart, { transform: [{ scale: heartScale }], opacity: heartScale }]}>
                <Ionicons name="heart" size={110} color={colors.rose} />
              </Animated.View>
            </Animated.View>

            {/* botones laterales */}
            <View style={styles.sideButtons}>
              <SideButton icon="add" label="Lista" onPress={() => navigation.navigate('AddToList', { bookId: current.id, title: current.titulo })} />
              <SideButton icon={favorites.has(current.id) ? 'heart' : 'heart-outline'} label="Fav" onPress={favorite} active={favorites.has(current.id)} />
              <SideButton icon="information" label="Info" onPress={() => navigation.push('Book', { id: current.id, preview: current })} />
            </View>
          </>
        ) : null}
      </View>

      {current && <Text style={styles.hint}>← quiero leer · ↓ siguiente · doble toque ♥ · leído →</Text>}
    </View>
  );
}

function CardContent({ book, coverW, isFavorite, coverOnly }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View>
        <BookCover book={book} width={coverW} />
        {isFavorite && (
          <View style={styles.favBadge}>
            <Ionicons name="heart" size={16} color={colors.white} />
          </View>
        )}
      </View>
      {!coverOnly && (
        <View style={styles.info}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {book.titulo}
      </Text>
      <Text style={styles.cardAuthor} numberOfLines={1}>
        {authorName(book)}
        {book.anio ? ` · ${book.anio}` : ''} · {book.tipo}
      </Text>
      {ratingValue(book) > 0 && <Stars value={ratingValue(book)} size={14} style={{ marginTop: 4 }} />}
        </View>
      )}
    </View>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.statText}>
        {value} {label}
      </Text>
    </View>
  );
}

function SideButton({ icon, label, onPress, active }) {
  return (
    <Pressable onPress={onPress} style={styles.sideBtnWrap} hitSlop={6}>
      <View style={[styles.sideBtn, active && { backgroundColor: colors.rose }]}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.sideLabel}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.whiteMuted, fontSize: 12, fontWeight: '700' },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', left: 0, right: 0, top: 6, alignItems: 'center' },
  cardBehind: { opacity: 0.45 },
  info: { alignItems: 'center', backgroundColor: colors.navy, paddingHorizontal: 12, paddingBottom: 4, borderRadius: 12 },
  cardTitle: { color: colors.white, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 14, maxWidth: 300 },
  cardAuthor: { color: colors.whiteMuted, marginTop: 4, maxWidth: 300, textAlign: 'center' },
  favBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.rose, borderRadius: 14, padding: 5 },
  stamp: { position: 'absolute', top: 30, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  stampRead: { left: 14, borderColor: colors.success, transform: [{ rotate: '-14deg' }] },
  stampLater: { right: 14, borderColor: '#8FB8CE', transform: [{ rotate: '14deg' }] },
  stampText: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  bigHeart: { position: 'absolute', top: '25%' },
  sideButtons: { position: 'absolute', right: 8, top: '30%', gap: 16 },
  sideBtnWrap: { alignItems: 'center' },
  sideBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  sideLabel: { color: colors.whiteMuted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  hint: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontSize: 12, paddingTop: 4, paddingBottom: 10 },
});
