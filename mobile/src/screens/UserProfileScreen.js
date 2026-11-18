import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import ProfileHeader from '../components/ProfileHeader';
import BookGrid from '../components/BookGrid';
import Segmented from '../components/Segmented';
import ListCard from '../components/ListCard';
import Button from '../components/Button';
import { Loading, ErrorState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { userBanner } from '../utils/helpers';
import { colors } from '../theme';

/** Perfil público de otro lector (igual que /usuario/:username en la web) */
export default function UserProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const { user: me, isLogged, refreshProfile, exitGuest } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('leidos');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await usersApi.search(username);
      const exact = (res?.results || []).find((u) => u.usuario === username);
      if (!exact) throw new Error('Usuario no encontrado');
      setData(exact);
      setFollowers(exact.seguidores || 0);
      if (isLogged) {
        const f = await usersApi.followers(exact.id);
        setFollowing((f?.seguidores || []).some((x) => Number(x.usuario?.id) === Number(me?.id)));
      }
    } catch (e) {
      setError(e.response ? getErrorMessage(e) : e.message);
    } finally {
      setLoading(false);
    }
  }, [username, isLogged, me?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!isLogged) return exitGuest();
    setBusy(true);
    try {
      if (following) {
        await usersApi.unfollow(data.id);
        setFollowing(false);
        setFollowers((n) => Math.max(0, n - 1));
      } else {
        await usersApi.follow(data.id);
        setFollowing(true);
        setFollowers((n) => n + 1);
        toast.show(`Ahora seguís a @${data.usuario}`);
      }
      refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading || error || !data) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader back title={`@${username}`} />
        {loading ? <Loading /> : <ErrorState message={error} onRetry={load} />}
      </View>
    );
  }

  const lists = Array.isArray(data.listas) ? data.listas : [];
  const tags = [
    data.genero_preferido && { label: 'Género favorito', value: data.genero_preferido },
    data.autor_preferido && { label: 'Autor favorito', value: data.autor_preferido },
    data.ratingPromedio && { label: 'Nota promedio', value: `★ ${data.ratingPromedio}` },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title={`@${data.usuario}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ProfileHeader
          name={`${data.nombre} ${data.apellido}`}
          username={data.usuario}
          bannerUri={userBanner(data)}
          avatarSrc={data.iconoData?.simbolo}
          description={data.descripcion}
          tags={tags}
          stats={[
            { label: 'Leídos', value: data.librosLeidos },
            { label: 'Seguidores', value: followers, onPress: () => navigation.push('FollowList', { userId: data.id, type: 'seguidores' }) },
            { label: 'Seguidos', value: data.siguiendo, onPress: () => navigation.push('FollowList', { userId: data.id, type: 'seguidos' }) },
            { label: 'Reseñas', value: data.cantidadResenas },
          ]}
        >
          {Number(data.id) !== Number(me?.id) && (
            <Button
              title={following ? 'Siguiendo' : 'Seguir'}
              icon={following ? 'checkmark' : 'person-add-outline'}
              variant={following ? 'outlineDark' : 'primary'}
              small
              loading={busy}
              onPress={toggleFollow}
              style={{ marginTop: 14, alignSelf: 'stretch' }}
            />
          )}
        </ProfileHeader>

        <Segmented
          options={[
            { key: 'leidos', label: 'Leídos', count: (data.libros_leidos || []).length },
            { key: 'listas', label: 'Listas públicas', count: lists.length },
          ]}
          value={tab}
          onChange={setTab}
          style={{ marginTop: 18, marginBottom: 14 }}
        />

        {tab === 'leidos' ? (
          <BookGrid books={data.libros_leidos || []} emptyText={`${data.usuario} todavía no tiene libros leídos.`} />
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {lists.length === 0 ? (
              <Text style={styles.empty}>No tiene listas públicas.</Text>
            ) : (
              lists.map((l) => <ListCard key={l.id || l.nombre} list={l} onPress={() => navigation.push('ListDetail', { name: l.nombre, readOnly: true, books: l.libros, owner: data.usuario })} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 30 },
});
