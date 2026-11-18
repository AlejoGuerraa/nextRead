import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import KeyboardAwareScroll from '../../components/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';

/** Fondo azul oscuro + scroll + teclado para las pantallas de acceso */
export default function AuthLayout({ children, back = true, onBack, center = false }) {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe}>
        {back && (
          <Pressable
            hitSlop={12}
            onPress={onBack || (() => navigation.goBack())}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </Pressable>
        )}
        <KeyboardAwareScroll
          contentContainerStyle={[styles.content, center && { justifyContent: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <View>{children}</View>
        </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  back: { paddingHorizontal: 18, paddingTop: 8, alignSelf: 'flex-start' },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 30, paddingTop: 10 },
});
