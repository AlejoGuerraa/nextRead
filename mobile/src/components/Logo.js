import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const logo = require('../../assets/logo.png');

/** Logo de NextRead: ícono de libros + "Next" blanco / "Read" rosa */
export default function Logo({ size = 120, showText = true, textSize = 34, horizontal = false }) {
  return (
    <View style={[styles.wrap, horizontal && styles.row]}>
      <Image source={logo} style={{ width: size, height: size }} resizeMode="contain" />
      {showText && <LogoText size={textSize} style={horizontal ? { marginLeft: 6 } : { marginTop: 4 }} />}
    </View>
  );
}

export function LogoText({ size = 22, style }) {
  return (
    <Text style={[styles.text, { fontSize: size }, style]}>
      Next<Text style={{ color: colors.pink }}>Read</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  text: { color: colors.white, fontWeight: '900', letterSpacing: 0.5 },
});
