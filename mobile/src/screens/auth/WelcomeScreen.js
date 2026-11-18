import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

const art = require('../../../assets/welcome.png');
const ART_RATIO = 705 / 566;

export default function WelcomeScreen({ navigation }) {
  const { enterAsGuest } = useAuth();
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Logo size={110} textSize={36} />
        <Text style={styles.tagline}>Descubrí tu próxima gran lectura</Text>
      </View>

      <Image source={art} style={{ width, height: width / ART_RATIO }} resizeMode="contain" />

      <View style={styles.actions}>
        <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Registrarse"
          variant="light"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 12 }}
        />
        <Pressable onPress={enterAsGuest} hitSlop={10} style={{ marginTop: 18 }}>
          <Text style={styles.guest}>Explorar sin cuenta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 30 },
  tagline: { color: colors.whiteMuted, fontSize: 15, marginTop: 10, fontWeight: '600' },
  actions: { paddingHorizontal: 32, paddingBottom: 24 },
  guest: { color: colors.white, textAlign: 'center', textDecorationLine: 'underline', fontWeight: '600' },
});
