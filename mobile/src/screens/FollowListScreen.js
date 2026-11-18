import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import Avatar from '../components/Avatar';
import Segmented from '../components/Segmented';
import { Loading, ErrorState, EmptyState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { colors, radius } from '../theme';

export default function FollowListScreen({ route, navigation }) {
  const { userId, type: initialType = 'seguidores' } = route.params;
  const { user: me } = useAuth();
  const [type, setType] = useState(initialType);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = type === 'seguidores' ? await usersApi.followers(userId) : await usersApi.following(userId);
      const list = type === 'seguidores' ? res?.seguidores : res?.seguidos;
      setItems((list || []).map((r) => r.usuario).filter(Boolean));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (u) => {
    if (Number(u.id) === Number(me?.id)) navigation.navigate('Tabs', { screen: 'Profile' });
    else navigation.push('UserProfile', { username: u.usuario, id: u.id });
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title={type === 'seguidores' ? 'Seguidores' : 'Seguidos'} />
      <Segmented
        options={[
          { key: 'seguidores', label: 'Seguidores' },
          { key: 'seguidos', label: 'Seguidos' },
        ]}
        value={type}
        onChange={setType}
        style={{ marginTop: 12 }}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={type === 'seguidores' ? 'Sin seguidores todavía' : 'No sigue a nadie todavía'}
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => open(item)}>
              <Avatar src={item.iconoData?.simbolo} name={item.usuario} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>
                  {item.nombre} {item.apellido}
                </Text>
                <Text style={styles.user}>@{item.usuario}</Text>
                {item.genero_preferido ? <Text style={styles.extra}>📚 {item.genero_preferido}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: radius.md, marginBottom: 10 },
  name: { fontWeight: '800', color: colors.text },
  user: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  extra: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
