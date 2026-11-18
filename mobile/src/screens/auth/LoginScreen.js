import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from './AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { LogoText } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';
import { colors } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next = {};
    if (!EMAIL_RE.test(correo.trim())) next.correo = 'Ingresá un correo válido';
    if (!contrasena) next.contrasena = 'Ingresá tu contraseña';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(correo, contrasena);
      // RootNavigator cambia solo a la app al haber usuario
    } catch (error) {
      if (error?.response?.data?.code === 'ACCOUNT_DISABLED') {
        setServerError('Tu cuenta está desactivada.');
      } else if (error?.response?.status === 429) {
        setServerError('Demasiados intentos. Esperá unos minutos y probá de nuevo.');
      } else {
        setServerError(getErrorMessage(error, 'Credenciales inválidas'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.kicker}>BIENVENIDO DE NUEVO A</Text>
      <LogoText size={34} style={{ textAlign: 'center' }} />
      <Text style={styles.subtitle}>¡Te extrañamos! Iniciá sesión para seguir leyendo.</Text>

      <View style={{ marginTop: 28 }}>
        <Input
          label="Correo electrónico"
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          value={correo}
          onChangeText={setCorreo}
          error={errors.correo}
        />
        <Input
          label="Contraseña"
          placeholder="••••••••"
          secure
          icon="lock-closed-outline"
          value={contrasena}
          onChangeText={setContrasena}
          error={errors.contrasena}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end' }}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <Button title="Iniciar sesión" onPress={submit} loading={loading} style={{ marginTop: 22 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenés cuenta? </Text>
          <Pressable onPress={() => navigation.replace('Register')}>
            <Text style={styles.footerLink}>Registrate</Text>
          </Pressable>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.whiteMuted, textAlign: 'center', fontWeight: '800', letterSpacing: 2, marginTop: 30, fontSize: 12 },
  subtitle: { color: colors.whiteMuted, textAlign: 'center', marginTop: 8 },
  link: { color: colors.sky, fontWeight: '700', marginTop: -4 },
  serverError: {
    color: colors.white,
    backgroundColor: 'rgba(224,70,90,0.85)',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: colors.whiteMuted },
  footerLink: { color: colors.sky, fontWeight: '800' },
});
