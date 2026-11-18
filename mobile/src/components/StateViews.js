import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors } from '../theme';

export function Loading({ label, dark = false }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[styles.muted, dark && { color: colors.whiteMuted }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'book-outline', title, message, action, onAction, dark = false }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={46} color={dark ? colors.whiteMuted : colors.textMuted} />
      {title ? <Text style={[styles.title, dark && { color: colors.white }]}>{title}</Text> : null}
      {message ? <Text style={[styles.muted, dark && { color: colors.whiteMuted }]}>{message}</Text> : null}
      {action ? <Button title={action} onPress={onAction} small style={{ marginTop: 14 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Algo salió mal"
      message={message}
      action={onRetry ? 'Reintentar' : null}
      onAction={onRetry}
    />
  );
}

/** Para pestañas que requieren cuenta cuando se navega como invitado */
export function LoginRequired({ onLogin, message = 'Iniciá sesión para usar esta sección.' }) {
  return (
    <EmptyState icon="lock-closed-outline" title="Necesitás una cuenta" message={message} action="Iniciar sesión" onAction={onLogin} />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 240 },
  title: { marginTop: 12, fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  muted: { marginTop: 6, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
