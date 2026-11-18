import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from './AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { colors } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresá un correo válido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo enviar el correo.'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout center>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="mail-open-outline" size={70} color={colors.sky} />
          <Text style={styles.title}>Revisá tu correo</Text>
          <Text style={styles.text}>
            Si existe una cuenta con {email.trim()}, te enviamos un enlace para restablecer tu contraseña.
          </Text>
          <Button title="Volver a iniciar sesión" onPress={() => navigation.navigate('Login')} style={{ marginTop: 28, alignSelf: 'stretch' }} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Text style={[styles.title, { marginTop: 40 }]}>Recuperar contraseña</Text>
      <Text style={styles.text}>Ingresá tu correo y te enviaremos un enlace para crear una nueva contraseña.</Text>
      <View style={{ marginTop: 28 }}>
        <Input
          label="Correo electrónico"
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={error}
        />
        <Button title="Enviar enlace" onPress={submit} loading={loading} style={{ marginTop: 10 }} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  text: { color: colors.whiteMuted, textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
