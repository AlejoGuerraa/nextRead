import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { API_URL, ASSETS_URL } from '../config';
import { colors, radius } from '../theme';

export default function SettingsScreen() {
  const { user, profile, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(null);

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title="Configuración" />
      <KeyboardAwareScroll contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={styles.group}>Cuenta</Text>
          <View style={styles.card}>
            <InfoRow icon="mail-outline" label="Correo" value={profile?.correo || user?.correo} />
            <InfoRow icon="at-outline" label="Usuario" value={profile?.usuario || user?.usuario} last />
          </View>

          <Text style={styles.group}>Seguridad</Text>
          <View style={styles.card}>
            <Row icon="key-outline" label="Cambiar contraseña" open={open === 'pwd'} onPress={() => setOpen(open === 'pwd' ? null : 'pwd')} />
            {open === 'pwd' && <ChangePassword toast={toast} onDone={() => setOpen(null)} />}
            <Row icon="mail-unread-outline" label="Cambiar correo" open={open === 'email'} onPress={() => setOpen(open === 'email' ? null : 'email')} />
            {open === 'email' && <ChangeEmail toast={toast} onDone={() => setOpen(null)} />}
            <Row icon="trash-outline" label="Eliminar cuenta" danger open={open === 'delete'} onPress={() => setOpen(open === 'delete' ? null : 'delete')} last />
            {open === 'delete' && <DeleteAccount toast={toast} onDeleted={logout} />}
          </View>

          <Button
            title="Cerrar sesión"
            icon="log-out-outline"
            variant="danger"
            onPress={() =>
              Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: logout },
              ])
            }
            style={{ marginTop: 24 }}
          />

          <Text style={styles.debug}>API: {API_URL}{'\n'}Imágenes: {ASSETS_URL}</Text>
      </KeyboardAwareScroll>
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
  );
}

function Row({ icon, label, onPress, open, danger, last }) {
  return (
    <Pressable style={[styles.row, last && !open && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.text} />
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function ChangePassword({ toast, onDone }) {
  const [currentPwd, setCurrent] = useState('');
  const [newPwd, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (newPwd.length < 8 || !/[A-Z]/.test(newPwd)) return setError('Mínimo 8 caracteres y una mayúscula');
    if (newPwd !== confirm) return setError('Las contraseñas no coinciden');
    setError('');
    setLoading(true);
    try {
      const res = await usersApi.changePassword(currentPwd, newPwd);
      toast.show(res?.message || res?.msg || 'Contraseña actualizada');
      onDone();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <Input dark={false} label="Contraseña actual" secure value={currentPwd} onChangeText={setCurrent} />
      <Input dark={false} label="Nueva contraseña" secure value={newPwd} onChangeText={setNew} />
      <Input dark={false} label="Repetir nueva contraseña" secure value={confirm} onChangeText={setConfirm} error={error} />
      <Button title="Actualizar" small onPress={submit} loading={loading} />
    </View>
  );
}

function ChangeEmail({ toast, onDone }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Correo inválido');
    setError('');
    setLoading(true);
    try {
      await usersApi.changeEmailRequest(email.trim());
      toast.show('Te enviamos un enlace de confirmación al nuevo correo');
      onDone();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <Input dark={false} label="Nuevo correo" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={error} />
      <Button title="Enviar confirmación" small onPress={submit} loading={loading} />
    </View>
  );
}

function DeleteAccount({ toast, onDeleted }) {
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const request = async () => {
    setLoading(true);
    try {
      await usersApi.deleteAccountRequest();
      setSent(true);
      toast.show('Te enviamos un correo con el código de confirmación');
    } catch (e) {
      toast.show(getErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirm = () =>
    Alert.alert('Eliminar cuenta', 'Esta acción no se puede deshacer. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await usersApi.deleteAccountConfirm(token.trim());
            toast.show('Cuenta eliminada');
            onDeleted();
          } catch (e) {
            toast.show(getErrorMessage(e), 'error');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);

  return (
    <View style={styles.form}>
      <Text style={styles.warn}>
        Para eliminar tu cuenta te enviamos un correo de confirmación. Pegá acá el código (token) que llega en el enlace.
      </Text>
      {!sent ? (
        <Button title="Enviar correo de confirmación" variant="danger" small onPress={request} loading={loading} />
      ) : (
        <>
          <Input dark={false} label="Código de confirmación" value={token} onChangeText={setToken} autoCapitalize="none" />
          <Button title="Eliminar definitivamente" variant="danger" small onPress={confirm} loading={loading} disabled={!token.trim()} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  group: { fontSize: 12, fontWeight: '900', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.bg, gap: 12 },
  rowLabel: { flex: 1, color: colors.text, fontWeight: '700' },
  rowValue: { color: colors.textMuted, maxWidth: '55%' },
  form: { padding: 14, backgroundColor: colors.cardAlt },
  warn: { color: colors.text, marginBottom: 12, lineHeight: 20 },
  debug: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 24 },
});
