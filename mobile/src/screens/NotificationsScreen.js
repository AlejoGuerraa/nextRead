import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import Avatar from '../components/Avatar';
import { EmptyState, LoginRequired } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { notificationsApi, usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { timeAgo } from '../utils/helpers';
import { colors, radius } from '../theme';

const ICON_BY_TYPE = {
  new_like: { name: 'heart', color: colors.rose },
  new_reply: { name: 'chatbubble', color: '#8FB8CE' },
  follow: { name: 'person-add', color: colors.success },
};

export default function NotificationsScreen({ navigation }) {
  const { isLogged, profile, refreshProfile, exitGuest } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const requested = useRef(new Set());
  const notifications = Array.isArray(profile?.notificaciones) ? profile.notificaciones : [];
  const hasUnread = notifications.some((n) => !n.leido);

  // Al entrar: refrescar y marcar todas como leídas (como hace la web al abrir el modal)
  useFocusEffect(
    useCallback(() => {
      if (!isLogged) return undefined;
      let active = true;
      (async () => {
        const fresh = await refreshProfile();
        const list = fresh?.notificaciones || [];
        if (active && list.some((n) => !n.leido)) {
          notificationsApi.markAllRead().then(() => {
            // dejamos el resaltado visible hasta salir; el badge se actualiza al refrescar
            setTimeout(() => refreshProfile(), 1500);
          }).catch(() => {});
        }
      })();
      return () => {
        active = false;
      };
    }, [isLogged, refreshProfile])
  );

  // Cargar avatar/usuario de quien generó cada notificación
  useEffect(() => {
    const ids = [...new Set(notifications.map((n) => n.meta?.fromUser).filter(Boolean))].filter((id) => !requested.current.has(id));
    if (!ids.length) return;
    ids.forEach((id) => requested.current.add(id));
    Promise.allSettled(ids.map((id) => usersApi.getPublic(id))).then((results) => {
      const next = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[ids[i]] = r.value;
      });
      setUsers((u) => ({ ...u, ...next }));
    });
  }, [notifications]);

  if (!isLogged) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader />
        <LoginRequired onLogin={exitGuest} message="Iniciá sesión para ver quién te sigue y reacciona a tus reseñas." />
      </View>
    );
  }

  const open = (n) => {
    const meta = n.meta || {};
    const from = users[meta.fromUser];
    if ((meta.type === 'new_like' || meta.type === 'new_reply') && meta.bookId) navigation.push('Book', { id: meta.bookId });
    else if (meta.type === 'follow' && from?.usuario) navigation.push('UserProfile', { username: from.usuario, id: from.id });
  };

  const remove = async (n) => {
    try {
      await notificationsApi.remove(n.id);
      refreshProfile();
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    }
  };

  const clearAll = () =>
    Alert.alert('Borrar notificaciones', '¿Querés borrar todas las notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationsApi.removeAll();
            refreshProfile();
          } catch (e) {
            toast.show(getErrorMessage(e), 'error');
          }
        },
      },
    ]);

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader
        title="Notificaciones"
        right={
          notifications.length > 0 ? (
            <Pressable hitSlop={10} onPress={clearAll}>
              <Ionicons name="trash-outline" size={21} color={colors.white} />
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
        ListHeaderComponent={hasUnread ? <Text style={styles.newLabel}>Nuevas</Text> : null}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="Sin notificaciones" message="Cuando alguien te siga o le guste tu reseña, lo vas a ver acá." />}
        renderItem={({ item }) => {
          const meta = item.meta || {};
          const from = users[meta.fromUser];
          const icon = ICON_BY_TYPE[meta.type] || { name: 'information-circle', color: colors.panelLight };
          const preview = meta.commentPreview || meta.replyPreview;
          return (
            <Pressable style={[styles.card, !item.leido && styles.unread]} onPress={() => open(item)}>
              <View>
                {from ? (
                  <Avatar src={from.iconoData?.simbolo} name={from.usuario} size={44} />
                ) : (
                  <View style={[styles.sysIcon, { backgroundColor: colors.panel }]}>
                    <Ionicons name="book" size={20} color={colors.white} />
                  </View>
                )}
                <View style={[styles.typeBadge, { backgroundColor: icon.color }]}>
                  <Ionicons name={icon.name} size={10} color={colors.white} />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.message}>{item.mensaje}</Text>
                {preview ? (
                  <Text style={styles.preview} numberOfLines={2}>
                    “{preview}”
                  </Text>
                ) : null}
                <Text style={styles.time}>{timeAgo(item.fecha)}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => remove(item)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  newLabel: { fontWeight: '800', color: colors.rose, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 10 },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.rose },
  sysIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  message: { color: colors.text, fontWeight: '600', lineHeight: 20 },
  preview: { color: colors.textMuted, fontStyle: 'italic', marginTop: 4, fontSize: 13 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
