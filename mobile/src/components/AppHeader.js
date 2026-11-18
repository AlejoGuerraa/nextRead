import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LogoText } from './Logo';
import { colors } from '../theme';

/**
 * Barra superior azul oscuro.
 * - Sin `title`: muestra el logo NextRead centrado (como en el wireframe)
 * - Con `title`: muestra flecha atrás + título
 */
export default function AppHeader({ title, back = false, right = null, dark = false }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 10, backgroundColor: dark ? colors.navy : colors.header },
      ]}
    >
      <View style={styles.side}>
        {back && (
          <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </Pressable>
        )}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <LogoText size={22} />
      )}
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  side: { width: 48 },
  iconBtn: { padding: 2 },
  title: { flex: 1, color: colors.white, fontSize: 19, fontWeight: '800', textAlign: 'center' },
});
