import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Logo from '../components/Logo';
import { colors } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Logo size={130} textSize={38} />
      <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
