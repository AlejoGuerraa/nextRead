import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import BookCover from '../components/BookCover';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { customListsToArray, isBookIn } from '../utils/helpers';
import { colors, radius } from '../theme';

/** Modal "Añadir a lista" + "Nueva lista" (pantallas del wireframe) */
export default function AddToListScreen({ route }) {
  const { bookId, title } = route.params;
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const lists = useMemo(() => customListsToArray(profile?.listas), [profile]);

  const toggle = async (list) => {
    const inList = isBookIn(list.libros, bookId);
    setBusy(list.nombre);
    try {
      if (inList) {
        await listsApi.removeBook(list.nombre, bookId);
        toast.show(`Quitado de "${list.nombre}"`);
      } else {
        await listsApi.addBook(list.nombre, bookId);
        toast.show(`Agregado a "${list.nombre}"`);
      }
      await refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return toast.show('Poné un nombre para la lista', 'error');
    setSaving(true);
    try {
      await listsApi.create(name, isPrivate);
      await listsApi.addBook(name, bookId);
      toast.show(`Lista "${name}" creada con ${title ? `"${title}"` : 'el libro'}`);
      setNewName('');
      setCreating(false);
      await refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader back title="Añadir a lista" dark />

      {creating ? (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre de la lista</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Ej: Para el verano"
            placeholderTextColor="#90A0B0"
            maxLength={50}
            style={styles.input}
            autoFocus
          />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Lista privada</Text>
              <Text style={styles.switchSub}>Solo vos vas a poder verla</Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: colors.primary }} thumbColor={colors.white} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Button title="Cancelar" variant="outline" onPress={() => setCreating(false)} style={{ flex: 1 }} />
            <Button title="Crear" icon="checkmark" onPress={create} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.nombre}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ padding: 18, gap: 14, flexGrow: 1 }}
          ListHeaderComponent={<Text style={styles.heading}>Tus listas</Text>}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no tenés listas. Creá la primera con el botón +</Text>
          }
          renderItem={({ item }) => {
            const inList = isBookIn(item.libros, bookId);
            const first = item.libros[0];
            return (
              <Pressable style={styles.listCard} onPress={() => toggle(item)} disabled={busy === item.nombre}>
                <View style={styles.coverBox}>
                  {first && typeof first === 'object' ? (
                    <BookCover book={first} width={84} />
                  ) : (
                    <Ionicons name="albums-outline" size={36} color={colors.textMuted} />
                  )}
                  <View style={[styles.check, inList && styles.checkOn]}>
                    {busy === item.nombre ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Ionicons name={inList ? 'checkmark' : 'add'} size={18} color={colors.white} />
                    )}
                  </View>
                </View>
                <Text style={styles.listName} numberOfLines={1}>
                  {item.isPrivate ? '🔒 ' : ''}
                  {item.nombre}
                </Text>
                <Text style={styles.listCount}>{item.libros.length} libros</Text>
              </Pressable>
            );
          }}
        />
      )}

      {!creating && (
        <Pressable style={styles.fab} onPress={() => setCreating(true)}>
          <Ionicons name="add" size={30} color={colors.navy} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.panel },
  heading: { color: colors.white, fontSize: 20, fontWeight: '900', marginBottom: 4 },
  empty: { color: colors.whiteMuted, textAlign: 'center', marginTop: 40 },
  listCard: { flex: 1, maxWidth: '50%' },
  coverBox: {
    height: 150,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary },
  listName: { color: colors.white, fontWeight: '800', marginTop: 8 },
  listCount: { color: colors.whiteMuted, fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  form: { padding: 20 },
  label: { color: colors.white, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: 14, height: 48, color: colors.text, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  switchTitle: { color: colors.white, fontWeight: '700' },
  switchSub: { color: colors.whiteMuted, fontSize: 12 },
});
