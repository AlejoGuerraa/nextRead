import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import BookCarousel from '../components/BookCarousel';
import ListCard from '../components/ListCard';
import Button from '../components/Button';
import { Loading, LoginRequired } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { customListsToArray } from '../utils/helpers';
import { colors, radius } from '../theme';

export const SHELF_INFO = {
  libros_en_lectura: { title: 'Leyendo', icon: 'book', tipo: 'enLectura', color: '#406882' },
  libros_para_leer: { title: 'Para leer', icon: 'time', tipo: 'paraLeer', color: '#6998AB' },
  libros_leidos: { title: 'Leídos', icon: 'bookmark', tipo: 'leido', color: colors.success },
  libros_favoritos: { title: 'Favoritos', icon: 'heart', tipo: 'favoritos', color: colors.rose },
};

export default function LibraryScreen({ navigation }) {
  const { isLogged, profile, refreshProfile, exitGuest } = useAuth();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

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
        <LoginRequired onLogin={exitGuest} message="Iniciá sesión para armar tu biblioteca y tus listas." />
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

  const create = async () => {
    if (!name.trim()) return toast.show('Poné un nombre para la lista', 'error');
    setSaving(true);
    try {
      await listsApi.create(name.trim(), isPrivate);
      toast.show('Lista creada');
      setModal(false);
      setName('');
      setIsPrivate(false);
      refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const reading = profile.libros_en_lectura || [];

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title="Mi biblioteca" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refreshProfile();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.shelves}>
          {Object.entries(SHELF_INFO).map(([field, info]) => (
            <Pressable
              key={field}
              style={styles.shelf}
              onPress={() => navigation.push('ListDetail', { shelf: field })}
            >
              <View style={[styles.shelfIcon, { backgroundColor: info.color }]}>
                <Ionicons name={info.icon} size={20} color={colors.white} />
              </View>
              <Text style={styles.shelfCount}>{(profile[field] || []).length}</Text>
              <Text style={styles.shelfTitle}>{info.title}</Text>
            </Pressable>
          ))}
        </View>

        {reading.length > 0 && <BookCarousel title="Seguí leyendo" books={reading} />}

        <View style={styles.listsHead}>
          <Text style={styles.sectionTitle}>Mis listas</Text>
          <Button title="Nueva" icon="add" small onPress={() => setModal(true)} />
        </View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {lists.length === 0 ? (
            <Text style={styles.empty}>Todavía no tenés listas personalizadas.</Text>
          ) : (
            lists.map((l) => <ListCard key={l.nombre} list={l} onPress={() => navigation.push('ListDetail', { name: l.nombre })} />)
          )}
        </View>
      </ScrollView>

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nueva lista</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la lista"
              placeholderTextColor="#90A0B0"
              maxLength={50}
              style={styles.input}
              autoFocus
            />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.white, flex: 1, fontWeight: '700' }}>Privada</Text>
              <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: colors.primary }} thumbColor={colors.white} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Button title="Cancelar" variant="outline" small onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Crear" small onPress={create} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  shelves: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  shelf: { width: '47.5%', backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  shelfIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  shelfCount: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 8 },
  shelfTitle: { color: colors.textMuted, fontWeight: '700' },
  listsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(10,17,89,0.55)', justifyContent: 'center', padding: 26 },
  modal: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: 20 },
  modalTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginBottom: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: 14, height: 46, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
});
