import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import KeyboardAwareScroll, { useKeyboardScroll } from '../components/KeyboardAwareScroll';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import BookCover from '../components/BookCover';
import BookCarousel from '../components/BookCarousel';
import Stars from '../components/Stars';
import Button from '../components/Button';
import ReviewItem from '../components/ReviewItem';
import { Loading, ErrorState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { booksApi, reviewsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { customListsToArray, isBookIn, parseList, ratingValue } from '../utils/helpers';
import { colors, radius } from '../theme';

// tipo de la API → campo en /nextread/user
const SHELVES = [
  { tipo: 'enLectura', field: 'libros_en_lectura', label: 'Leyendo', on: 'book', off: 'book-outline', status: true },
  { tipo: 'favoritos', field: 'libros_favoritos', label: 'Favorito', on: 'heart', off: 'heart-outline' },
  { tipo: 'paraLeer', field: 'libros_para_leer', label: 'Para leer', on: 'time', off: 'time-outline', status: true },
  { tipo: 'leido', field: 'libros_leidos', label: 'Leído', on: 'bookmark', off: 'bookmark-outline', status: true },
];

export default function BookScreen({ route, navigation }) {
  const { id, preview } = route.params;
  const { user, profile, isLogged, refreshProfile, exitGuest } = useAuth();
  const toast = useToast();

  const [book, setBook] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [shelves, setShelves] = useState({});
  const [busyShelf, setBusyShelf] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [rateModal, setRateModal] = useState(false);

  const myReview = useMemo(
    () => reviews.find((r) => Number(r.Usuario?.id ?? r.usuario_id) === Number(user?.id)),
    [reviews, user?.id]
  );

  const loadReviews = useCallback(async () => {
    try {
      const list = await reviewsApi.list(id);
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      // no bloquea la pantalla
    }
  }, [id]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await booksApi.getById(id);
      setBook({ ...data, generos: parseList(data.generos) });
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo cargar el libro.'));
    } finally {
      setLoading(false);
    }
    loadReviews();
  }, [id, loadReviews]);

  useEffect(() => {
    load();
  }, [load]);

  // Estados de las estanterías a partir del perfil completo
  useEffect(() => {
    if (!profile) return;
    const next = {};
    SHELVES.forEach((s) => (next[s.tipo] = isBookIn(profile[s.field], id)));
    next.lista = customListsToArray(profile.listas).some((l) => isBookIn(l.libros, id));
    setShelves(next);
  }, [profile, id]);

  useEffect(() => {
    if (myReview?.puntuacion) setMyRating(Number(myReview.puntuacion));
  }, [myReview]);

  // "Porque te gustó…" solo funciona si el libro está leído con 4-5 estrellas
  useEffect(() => {
    if (!isLogged || !shelves.leido) return;
    booksApi
      .similar(user.id, id)
      .then((res) => setSimilar(Array.isArray(res?.libros) ? res.libros : []))
      .catch(() => setSimilar([]));
  }, [isLogged, shelves.leido, myRating, user?.id, id]);

  const requireLogin = () => {
    Alert.alert('Necesitás una cuenta', 'Iniciá sesión para guardar libros, valorar y comentar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Iniciar sesión', onPress: exitGuest },
    ]);
  };

  const toggleShelf = async (shelf) => {
    if (!isLogged) return requireLogin();
    const active = shelves[shelf.tipo];
    setBusyShelf(shelf.tipo);
    // actualización optimista: leyendo / para leer / leído son excluyentes
    setShelves((prev) => {
      const next = { ...prev, [shelf.tipo]: !active };
      if (!active && shelf.status) SHELVES.filter((s) => s.status && s.tipo !== shelf.tipo).forEach((s) => (next[s.tipo] = false));
      return next;
    });
    try {
      const res = active ? await booksApi.removeFromShelf(shelf.tipo, id) : await booksApi.addToShelf(shelf.tipo, id);
      toast.show(res?.message || 'Libro actualizado');
      if (!active && shelf.tipo === 'leido' && !myRating) setRateModal(true);
      refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
      refreshProfile();
    } finally {
      setBusyShelf(null);
    }
  };

  const saveRating = async (value) => {
    if (!isLogged) return requireLogin();
    const prev = myRating;
    setMyRating(value);
    try {
      const payload = { puntuacion: value };
      // la API guarda una sola reseña por libro: mantenemos el comentario existente
      if (myReview?.comentario) payload.comentario = myReview.comentario;
      await reviewsApi.save(id, payload);
      toast.show(`Le diste ${value} ${value === 1 ? 'estrella' : 'estrellas'} ⭐`);
      loadReviews();
    } catch (e) {
      setMyRating(prev);
      toast.show(getErrorMessage(e), 'error');
    }
  };

  const postReview = async () => {
    if (!isLogged) return requireLogin();
    if (!comment.trim()) return toast.show('La reseña no puede estar vacía', 'error');
    setPosting(true);
    try {
      await reviewsApi.save(id, { puntuacion: myRating || null, comentario: comment.trim() });
      setComment('');
      toast.show('Reseña publicada');
      loadReviews();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (review) => {
    if (!isLogged) return requireLogin();
    const liked = review.likedByCurrentUser;
    setReviews((list) =>
      list.map((r) => (r.id === review.id ? { ...r, likedByCurrentUser: !liked, likes: (r.likes || 0) + (liked ? -1 : 1) } : r))
    );
    try {
      const res = liked ? await reviewsApi.unlike(review.id) : await reviewsApi.like(review.id);
      if (typeof res?.likes === 'number') {
        setReviews((list) => list.map((r) => (r.id === review.id ? { ...r, likes: res.likes, likedByCurrentUser: res.liked } : r)));
      }
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
      loadReviews();
    }
  };

  const reply = async (review, text) => {
    if (!isLogged) {
      requireLogin();
      return false;
    }
    try {
      await reviewsApi.reply(review.id, text);
      loadReviews();
      return true;
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
      return false;
    }
  };

  const deleteReview = (review) => {
    Alert.alert('Eliminar reseña', '¿Seguro que querés eliminar tu reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewsApi.remove(review.id);
            setMyRating(0);
            toast.show('Reseña eliminada');
            loadReviews();
          } catch (e) {
            toast.show(getErrorMessage(e), 'error');
          }
        },
      },
    ]);
  };

  const openUser = (u) => {
    if (!u?.usuario) return;
    if (Number(u.id) === Number(user?.id)) navigation.navigate('Tabs', { screen: 'Profile' });
    else navigation.push('UserProfile', { username: u.usuario, id: u.id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader back />
        <Loading />
      </View>
    );
  }
  if (error && !book) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader back />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  const generos = parseList(book.generos);
  const visibleReviews = reviews.filter((r) => r.comentario);
  const description = book.descripcion || 'Sin descripción disponible.';

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back />
      <KeyboardAwareScroll contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Portada y datos */}
          <View style={styles.top}>
            <Text style={styles.title}>{book.titulo}</Text>
            {book.Autor ? (
              <Pressable onPress={() => navigation.push('Author', { id: book.Autor.id, name: book.Autor.nombre })}>
                <Text style={styles.author}>
                  {book.Autor.nombre} <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.author}>Autor desconocido</Text>
            )}
            <BookCover book={book} width={190} style={{ marginTop: 16 }} />
            <View style={styles.ratingRow}>
              <Stars value={ratingValue(book)} size={18} />
              <Text style={styles.ratingText}>{ratingValue(book).toFixed(1)} / 5</Text>
            </View>
          </View>

          {/* Panel de acciones (como el wireframe) */}
          <View style={styles.panel}>
            <View style={styles.shelfRow}>
              {SHELVES.map((s) => {
                const active = shelves[s.tipo];
                return (
                  <Pressable key={s.tipo} style={styles.shelfBtn} onPress={() => toggleShelf(s)} disabled={busyShelf === s.tipo}>
                    <View style={[styles.shelfIcon, active && styles.shelfIconActive]}>
                      <Ionicons name={active ? s.on : s.off} size={22} color={active ? colors.white : colors.whiteMuted} />
                    </View>
                    <Text style={[styles.shelfLabel, active && { color: colors.white }]}>{s.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.shelfBtn}
                onPress={() => (isLogged ? navigation.navigate('AddToList', { bookId: id, title: book.titulo }) : requireLogin())}
              >
                <View style={[styles.shelfIcon, shelves.lista && styles.shelfIconActive]}>
                  <Ionicons name={shelves.lista ? 'add-circle' : 'add-circle-outline'} size={22} color={shelves.lista ? colors.white : colors.whiteMuted} />
                </View>
                <Text style={[styles.shelfLabel, shelves.lista && { color: colors.white }]}>Lista</Text>
              </Pressable>
            </View>
            <View style={styles.divider} />
            <Text style={styles.panelLabel}>Tu valoración</Text>
            <Stars value={myRating} size={30} onChange={saveRating} style={{ alignSelf: 'center', marginTop: 6 }} />
          </View>

          {/* Info */}
          <View style={styles.section}>
            <View style={styles.chips}>
              {book.anio ? <Chip icon="calendar-outline" text={String(book.anio)} /> : null}
              {book.tipo ? <Chip icon="pricetag-outline" text={book.tipo} /> : null}
              {generos.map((g) => (
                <Chip key={g} text={g} />
              ))}
            </View>
            <Text style={styles.sectionTitle}>Sinopsis</Text>
            <Text style={styles.description} numberOfLines={expanded ? undefined : 6}>
              {description}
            </Text>
            {description.length > 280 && (
              <Pressable onPress={() => setExpanded((e) => !e)}>
                <Text style={styles.more}>{expanded ? 'Ver menos' : 'Leer más'}</Text>
              </Pressable>
            )}
          </View>

          {similar.length > 0 && <BookCarousel title="Porque te gustó este libro" books={similar} />}

          {/* Reseñas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reseñas ({visibleReviews.length})</Text>
            {!myReview?.comentario && (
              <View style={styles.writeBox}>
                <Text style={styles.writeLabel}>Escribí tu reseña</Text>
                <RevealInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder={isLogged ? '¿Qué te pareció el libro?' : 'Iniciá sesión para escribir una reseña'}
                  placeholderTextColor="#90A0B0"
                  multiline
                  maxLength={300}
                  editable={isLogged}
                  style={styles.writeInput}
                />
                <View style={styles.writeFooter}>
                  <Text style={styles.counter}>{comment.length}/300</Text>
                  <Button title="Publicar" small onPress={isLogged ? postReview : requireLogin} loading={posting} />
                </View>
              </View>
            )}
            {visibleReviews.length === 0 ? (
              <Text style={styles.noReviews}>Todavía no hay reseñas. ¡Sé el primero!</Text>
            ) : (
              visibleReviews.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  isOwn={Number(r.Usuario?.id ?? r.usuario_id) === Number(user?.id)}
                  canInteract={isLogged}
                  onLike={toggleLike}
                  onReply={reply}
                  onDelete={deleteReview}
                  onPressUser={openUser}
                />
              ))
            )}
          </View>
      </KeyboardAwareScroll>

      {/* Modal "¿Qué te pareció?" al marcar como leído */}
      <Modal visible={rateModal} transparent animationType="fade" onRequestClose={() => setRateModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Ionicons name="sparkles" size={34} color={colors.primary} />
            <Text style={styles.modalTitle}>¡Terminaste {book.titulo}!</Text>
            <Text style={styles.modalText}>¿Qué te pareció?</Text>
            <Stars
              value={myRating}
              size={36}
              onChange={(v) => {
                saveRating(v);
                setRateModal(false);
              }}
              style={{ marginVertical: 16 }}
            />
            <Pressable onPress={() => setRateModal(false)}>
              <Text style={styles.more}>Ahora no</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Chip({ icon, text }) {
  return (
    <View style={styles.chip}>
      {icon && <Ionicons name={icon} size={12} color={colors.text} style={{ marginRight: 4 }} />}
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 22 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center' },
  author: { fontSize: 15, color: colors.primary, fontWeight: '700', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  ratingText: { color: colors.text, fontWeight: '800' },
  panel: { backgroundColor: colors.panel, paddingVertical: 18, paddingHorizontal: 10 },
  shelfRow: { flexDirection: 'row', justifyContent: 'space-around' },
  shelfBtn: { alignItems: 'center', width: 64 },
  shelfIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  shelfIconActive: { backgroundColor: colors.primary },
  shelfLabel: { color: colors.whiteMuted, fontSize: 11, marginTop: 5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14, marginHorizontal: 10 },
  panelLabel: { color: colors.white, textAlign: 'center', fontWeight: '800' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  description: { color: colors.text, lineHeight: 22, fontSize: 15 },
  more: { color: colors.primary, fontWeight: '800', marginTop: 6 },
  writeBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 14 },
  writeLabel: { fontWeight: '800', color: colors.text, marginBottom: 8 },
  writeInput: { backgroundColor: colors.cardAlt, borderRadius: radius.sm, padding: 10, minHeight: 80, textAlignVertical: 'top', color: colors.text },
  writeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  counter: { color: colors.textMuted, fontSize: 12 },
  noReviews: { color: colors.textMuted, textAlign: 'center', marginVertical: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(10,17,89,0.55)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modal: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: 26, alignItems: 'center', width: '100%' },
  modalTitle: { color: colors.white, fontSize: 19, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  modalText: { color: colors.whiteMuted, marginTop: 4 },
});

/** TextInput que avisa al scroll para quedar arriba del teclado */
function RevealInput(props) {
  const { reveal } = useKeyboardScroll();
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        reveal();
        props.onFocus?.(e);
      }}
    />
  );
}
