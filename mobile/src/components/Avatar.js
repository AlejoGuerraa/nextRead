import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { assetUrl } from '../utils/helpers';

/** Avatar circular. `src` puede ser una ruta "/iconos/..." o URL */
export default function Avatar({ src, name = '', size = 48, border = false, style }) {
  const [failed, setFailed] = useState(false);
  const uri = assetUrl(src);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        border && { borderWidth: 3, borderColor: colors.white },
        style,
      ]}
    >
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: { color: colors.white, fontWeight: '800' },
});
