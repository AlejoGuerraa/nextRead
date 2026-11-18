import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import BookCover from '../components/BookCover';
import Button from '../components/Button';
import Stars from '../components/Stars';
import { EmptyState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { booksApi, listsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { authorName, customListsToArray } from '../utils/helpers';
import { SHELF_INFO } from './LibraryScreen';
import { colors, radius } from '../theme';

/**
 * Detalle de una colección de libros. Tres modos:
 *  - { shelf: 'libros_leidos' }      → estantería propia (Leídos, Favoritos…)
 *  - { name: 'Mi lista' }            → lista personalizada propia (renombrar, privacidad, borrar)
 *  - { readOnly, books, name, owner } → lista pública de otro usuario
 */
export default function ListDetailScreen({ route, navigation }) {
  const { shelf, name: initialName, readOnly, books: passedBooks, owner } = route.params;
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(initialName || '');
  const [draftPrivate, setDraftPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => {
    if (readOnly) return { nombre: name, libros: passedBooks || [] };
    if (shelf) return { nombre: SHELF_INFO[shelf].title, libros: profile?.[shelf] || [] };
    return customListsToArray(profile?.listas).find((l) => l.nombre === name) || { nombre: name, libros: [] };
  }, [readOnly, shelf, name, passedBooks, profile]);

  const books = (list.libros || []).filter((b) => b && typeof b === 'object');
  const editable = !readOnly;

  const removeBook = (book) => {
    Alert.alert('Quitar libro', `¿Quitar "${book.titulo}" de ${list.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (shelf) await booksApi.removeFromShelf(SHELF_INFO[shelf].tipo, book.id);
            else await listsApi.removeBook(name, book.id);
            toast.show('Libro quitado');
            refreshProfile();
          } catch (e) {
            toast.show(getErrorMessage(e), 'error');
          }
        },
      },
    ]);
  };

  const openEdit = () => {
    setDraftName(name);
    setDraftPrivate(Boolean(list.isPrivate));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const next = draftName.trim();
    if (!next) return toast.show('El nombre no puede estar vacío', 'error');
    setSaving(true);
    try {
      await listsApi.update(name, { nombre: next, isPrivate: draftPrivate });
      setName(next);
      setEditOpen(false);
      toast.show('Lista actualizada');
      refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteList = () => {
    Alert.alert('Eliminar lista', `¿Eliminar la lista "${name}"? Los libros no se borran.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await listsApi.remove(name);
            toast.show('Lista eliminada');
            await refreshProfile();
            navigation.goBack();
          } catch (e) {
            toast.show(getErrorMessage(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader
        back
        title={list.nombre}
        right={
          editable && !shelf ? (
            <Pressable hitSlop={10} onPress={openEdit}>
              <Ionicons name="create-outline" size={22} color={colors.white} />
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={books}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={
          <Text style={styles.meta}>
            {books.length} {books.length === 1 ? 'libro' : 'libros'}
            {owner ? ` · lista de @${owner}` : ''}
            {list.isPrivate ? ' · 🔒 Privada' : ''}
          </Text>
        }
        ListEmptyComponent={<EmptyState icon="albums-outline" title="Lista vacía" message="Agregá libros desde la pantalla de cada libro." />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.push('Book', { id: item.id, preview: item })}>
            <BookCover book={item} width={54} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text style={styles.author}>{authorName(item)}</Text>
              {item.puntuacion_usuario ? <Stars value={Number(item.puntuacion_usuario)} size={12} color={colors.primary} /> : null}
            </View>
            {editable && (
              <Pressable hitSlop={10} onPress={() => removeBook(item)} style={{ padding: 6 }}>
                <Ionicons name="remove-circle-outline" size={22} color={colors.danger} />
              </Pressable>
            )}
          </Pressable>
        )}
      />

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Editar lista</Text>
            <TextInput value={draftName} onChangeText={setDraftName} maxLength={50} style={styles.input} placeholderTextColor="#90A0B0" />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.white, flex: 1, fontWeight: '700' }}>Privada</Text>
              <Switch value={draftPrivate} onValueChange={setDraftPrivate} trackColor={{ true: colors.primary }} thumbColor={colors.white} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Button title="Cancelar" variant="outline" small onPress={() => setEditOpen(false)} style={{ flex: 1 }} />
              <Button title="Guardar" small onPress={saveEdit} loading={saving} style={{ flex: 1 }} />
            </View>
            <Button title="Eliminar lista" variant="ghost" icon="trash-outline" small onPress={() => { setEditOpen(false); deleteList(); }} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  meta: { color: colors.textMuted, marginBottom: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 10, marginBottom: 10 },
  title: { fontWeight: '800', color: colors.text },
  author: { color: colors.textMuted, fontSize: 13, marginVertical: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(10,17,89,0.55)', justifyContent: 'center', padding: 26 },
  modal: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: 20 },
  modalTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginBottom: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: 14, height: 46, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
});
